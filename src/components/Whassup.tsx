import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOS } from '../hooks/useOperatingSystem';
import './Whassup.css';
import ContactsList from './ContactsList';
import ChatWindow from './ChatWindow';
import { WhassupMessageCounter } from './WhassupMessageCounter';
import { Message, User } from '../backgroundservices/desktopservices/service-whassup';

// hack to workaround tyepscript hell
import {HackSoundPlayerNewMessage} from './HackSoundPlayerNewMessage'

const STORAGE_KEY = 'lastWhassupContactId';
let lastUnreadCheckTime = 0;

/**
 * I have wasted literal hours trying to get the message-counts correct on this class.
 * Claude and ChatGPT are both appallingly bad at messing-up the basic logic, and failing
 * the simplest of consistency checks.
 * 
 * I can only seem to get it 'broken in one way, working in 3 others', and change which
 * of the common situations is the broken one.
 * 
 * It seems like all the key elements are here, but the LLM's are stunningly incompetent
 * at dealing with them.
 * 
 * @param param0 
 * @returns 
 */
const Whassup = ({ isFocused, appId }) => {
  //console.warn("Whassup recreated with appID: " + appId)
  const os = useOS();
  const chatService = os.chatService;
  const [contacts,setContacts] = useState([]);
  const [chatThreads, setChatThreads] = useState({});
  const messageCounter = useMemo(() => new WhassupMessageCounter(), []); 

  // Initialize selectedUserId from storage
  const [selectedUserId, setSelectedUserId] = useState(() => {
    const storedId = sessionStorage.getItem(STORAGE_KEY);
    //console.log(`initializing selectedUserId with storedId = ${storedId}`)
    return storedId && contacts.some(contact => contact.id === storedId)
      ? storedId
      : null;
  });

  const lastSelectedUserIdRef = useRef(selectedUserId); // necessary because react useEffect is broken-by-design unless using ref' objects as its input
  const soundPlayerRef = useRef(null); // Ref for the SoundPlayer-hack component

  /** I hate LLMs writing code - they are spectacularly incompetent (GPT4o and worst of all: Claude Sonnet) */

  // Minimal setup on mount
  useEffect(() => {
    //console.warn("Whassup mounting")
    console.log("----------- mounting: ---------------");
    os.setAppMounted(appId, true); // Stop OS from maintaining unread counts
    os.setUnreadCount(appId, 0);  // Reset unread count

    /** MOVED: unread-messages counts to the 'post-contacts' useEffect, so that we guarantee the contacts EXIST befor we try to fetch their messages */

    // UN-mount:
    return () => {
      //console.warn("Whassup UN mounting")
      // Store the unread counts mapped interanlly to each user
      messageCounter.saveCountersIfWhassupIsUnmounting();

      // Let OS take over unread counts
      os.setAppMounted(appId, false);

      // Save the selected user ID
      //console.log(`saving selectedUserId = ${lastSelectedUserIdRef.current}`)
      if (lastSelectedUserIdRef.current) {
        sessionStorage.setItem(STORAGE_KEY, lastSelectedUserIdRef.current);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    };
  }, []);

  /** Selected-user changed */
  useEffect(() => {
    //console.log(`SELECTED USER ID changed, to ${selectedUserId}`)
    //console.log(`before procesisng selected user, state of unread counters:`);
    messageCounter.debugCounters();

    if (selectedUserId) {
      // Fetch ALL messages for the selected user
      const messages = chatService.fetchMessagesSince(selectedUserId, 0);
      setChatThreads(prev => ({ ...prev, [selectedUserId]: messages }));

      // Clear unread counts for the selected user
      messageCounter.clearForUser(selectedUserId);
      os.setUnreadCount(appId, messageCounter.getTotalUnread());
    }
    lastSelectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  /** Subscribe to messages from the chat-service */
  useEffect(() => {
    const handleNewMessage = (incoming: boolean, userId: string, message: Message) =>
      {
        console.log("----------- processing new incoming message ---------------");
      setChatThreads(prevThreads => ({
        ...prevThreads,
        [userId]: [...(prevThreads[userId] || []), message],
      }));

      if (incoming)
      {
        if (userId === selectedUserId)
          {
          // If the new message is for the currently selected user, mark it as read
          console.log("INCOMING message is for SELECTED user - so wiping the messages-unread count for that user!")
          messageCounter.clearForUser(userId);
          os.setUnreadCount(appId, messageCounter.getTotalUnread());
        } else {
          console.log(`NOT from selected ${selectedUserId}, message instead from userid: '${userId}'`)
          // Otherwise, increment the unread count
        messageCounter.incrementForUser(userId);
        //console.log("useChat will call getunread and setunread")
        os.setUnreadCount(appId, messageCounter.getTotalUnread());
      }

      // Play sound for new incoming messages
      if (soundPlayerRef.current) {
        soundPlayerRef.current.playSound();
      }
    }
    };

    const handleNewIncoming = (userId: string, message: Message) =>
      handleNewMessage(true, userId, message);
    const handleNewOutgoing = (userId: string, message: Message) =>
      handleNewMessage(false, userId, message);

    chatService.onMessageReceivedFrom.addListener(handleNewIncoming);
    chatService.onMessageSentTo.addListener(handleNewOutgoing);

    return () => {
      chatService.onMessageReceivedFrom.removeListener(handleNewIncoming);
      chatService.onMessageSentTo.removeListener(handleNewOutgoing);
      lastUnreadCheckTime = Date.now(); // because we're unsubscribing from listening ourselves
    };
  }, []);

  useEffect(() =>{
    const handleNewContact = (newUser: User) =>
    {
      setContacts(chatService.getAvailableNPCs());
    }

    // set initial value:
    setContacts(chatService.getAvailableNPCs());
    // register for updates to initial value:
    chatService.onContactAdded.addListener(handleNewContact);

    return() => {
      chatService.onContactAdded.removeListener(handleNewContact);
    }
  }, []);

  // this will run on first mount very rapidly after the mount, as soon as 'contacts' goes live, and fix the message counts
  useEffect(()=>{
    // Fetch unread messages for all users
    const userIds = contacts.map(contact => contact.id);
    console.log("   will check for new messages for all users in: "+JSON.stringify(userIds)+" since: "+lastUnreadCheckTime+" (time now: "+Date.now()+")");
    const unreadMessagesWithUserIds = userIds.flatMap(userId => {
      const messages = chatService.fetchMessagesSince(userId, lastUnreadCheckTime);
      // Decorate each message with the corresponding userId
      return messages.map(message => ({
        ...message,
        userId,
      }));
    });
    lastUnreadCheckTime = Date.now(); // because we just updated it

    // Initialize unread counts for all users
    console.log("unread counter BEFORE updating with new unreads:")
    messageCounter.debugCounters();
    messageCounter.updateByAddingNewUnreadMessages(unreadMessagesWithUserIds, userIds);

    // Synchronize total unread count with the OS
    os.setUnreadCount(appId, messageCounter.getTotalUnread());
  }, [contacts]);

  const handleContactSelect = async (userId) => {
    //console.log(`selected user id via mouse: ${userId}`)
    setSelectedUserId(userId);
  };


  const selectedUser = selectedUserId ? contacts.find(u => u.id === selectedUserId) : null;

  return (
    <div className={`whassup-container ${selectedUser ? 'chat-open' : ''}`}>
      <HackSoundPlayerNewMessage ref={soundPlayerRef} /> {/* Add the SoundPlayer component */}
      <ContactsList
        contacts={contacts}
        selectedUserId={selectedUserId}
        messageCounter={messageCounter}
        onContactSelect={handleContactSelect}
        isMinimized={!!selectedUser}
      />
      {selectedUser && (
        <ChatWindow
          selectedUser={selectedUser}
          messages={chatThreads[selectedUserId] || []}
          onBack={() => setSelectedUserId(null)}
          onSendMessage={(message) => chatService.addMessageTo(selectedUserId, message)}
          chatService={chatService}
        />
      )}
    </div>
  );
};

export default Whassup;