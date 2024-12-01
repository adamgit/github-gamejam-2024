import React, { useContext, useEffect, useRef, useState } from 'react';
import TerminalPrompt from './TerminalPrompt';
import TerminalInput from './TerminalInput';
import './Terminal.css';
import { RemoteHost, RemoteSession } from '../data/HostConnection';
import { colorForHost } from './Terminal-utils';
import { HostResolver } from '../data/HostResolver';

import { useOS } from '../hooks/useOperatingSystem'; // so we can enable cheat-mode at the OS level

interface TerminalProps {
  isFocused: boolean;
  initialHostConnection: RemoteHost;
  onClose: () => void;
  autoConnectHostname?: string;
  autoConnectUsername?: string;
  autoConnectPassword?: string;
}

interface MessageAndMetadata {
  text: string;
  host: RemoteHost | null;
}


const Terminal = ({ isFocused, initialHostConnection, onClose, autoConnectHostname, autoConnectUsername, autoConnectPassword }: TerminalProps) =>
{
  const os = useOS(); // so we can enable cheat-mode at the OS level

  const [session, setSession] = useState<RemoteSession>();
  const [sessionStack, setSessionStack] = useState<RemoteSession[]>([]);
  const [environmentVersion, setEnvironmentVersion] = useState(0);

  const [messages, setMessages] = useState<MessageAndMetadata[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyPressed = useRef<string | null>(null); // useRef so that it doesn't trigger re-renders, since it's invisible state for the Shell, not for the Terminal

  // Add a ref to track which sessions have already had callbacks attached (so we can suspend them when we connect to a new Session, but keep the old Session/connection live)
  const initializedSessions = useRef<Set<RemoteSession>>(new Set());

  const scrollRef = useRef<any>(null);                 // Ref to track scrolling
  const bufferSize = 100;                         // Max number of lines in scrollback buffer

  // late-initialize the session object
  useEffect(() => {
    if( initialHostConnection )
    {
      if( autoConnectHostname )
      {
        // do NOT use the initialHostConnection; create a new one
        const overrideConnection = HostResolver.getInstance().resolve(autoConnectHostname);
        setSession(overrideConnection.createNewSession());
      }
      else
      {
        setSession(initialHostConnection.createNewSession());
      }
    }
  }, []);

  // post-initializae the session object (react annoyingly encapsulates local state and sends incorrect closure otherwise)
  useEffect(() => {
    if (session && !initializedSessions.current.has(session)) {
      initializedSessions.current.add(session);
      
      session.attachLocalConsole(
        asyncIncomingMessage,
        asyncOverwriteInputBuffer,
        () => setEnvironmentVersion(v => v + 1),
        handleExit
      );

      if( autoConnectUsername )
      {
        sysOut("Will attempt to login with credentials (username: "+autoConnectUsername+" / password: "+autoConnectPassword+")");
        session.executeCommand(autoConnectUsername);
        session.executeCommand(autoConnectPassword);
      }
    }
  }, [session]);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Autofocus the mini-window when isFocused changes - but do it async because React has a poor implementation/interaction with HTML browsers
  useEffect(() => {
    if (isFocused) {
      window.requestAnimationFrame(function () {
        inputRef.current?.focus();
      });

    }
  }, [isFocused]);

  useEffect(() => {
    // This function will be called when the component is unmounted
    return () => {
      if (session)
        session.clientDisconnected();

      for (let i = sessionStack.length - 1; i >= 0; i--) {
        const item = sessionStack[i];
        item.clientDisconnected();
      }
      
      initializedSessions.current.clear();
    };
  }, []);

  const asyncIncomingMessage = (newMessage) => {
    console.log("INCOMING MSG [host: " + session?.host.fqdn + "], msg [" + newMessage + "]");
    sysOut(newMessage);
  }

  const asyncOverwriteInputBuffer = (newInputBuffer) => {
    console.log("OVERWRITING INPUT BUFFER [host: " + session + "], new buffer [" + newInputBuffer + "]");
    setInput(newInputBuffer);
  }

  /**
   * When the user types 'exit' or something force-disconnects (e.g. a server disconnects the terminal)
   */
  const handleExit = () => {
    if (session) {
      session.clientDisconnected();
    }

    if (sessionStack.length > 0) {
      const restoringSession = sessionStack[sessionStack.length - 1];
      restoringSession.resumeCallbacks();
      setSession(restoringSession);
      setSessionStack(sessionStack.slice(0, sessionStack.length - 1));
      sysOut(`Disconnected.`);
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e) =>
  {
    if (e.key === 'ArrowUp') {
      // Prevent the default behavior
      e.preventDefault();
      
      if( session )
        session.cursorUpPressed(input, inputRef.current?.selectionEnd ?? input.length);
    }
    else if (e.key === 'ArrowDown') {
      // Prevent the default behavior
      e.preventDefault();
      
      if( session )
        session.cursorDownPressed(input, inputRef.current?.selectionEnd ?? input.length);
    }
    else if (e.key === 'Tab') {
      // Prevent the default tab behavior
      e.preventDefault();
      
      const isSecondTab = lastKeyPressed.current === 'Tab';
      console.log("Tab pressed ;; is second in a row? "+isSecondTab);

      if( session )
        session.tabPressed(input, inputRef.current?.selectionEnd ?? input.length, isSecondTab );
    }
    else if (e.key === 'Enter') {
      sysOut(`> ${input}`);  // Add the user input as a new message

      if (input === 'exit') {
        handleExit();
      }
      else if (input.startsWith('connect'))
      {
        if (input.indexOf(' ') > 0) {
          const args = input.split(' ').slice(1);
          //console.log(`attempting connect to host: '${args[0]}'`);
          //console.log(`will attempt to read the resolver on OS: ${JSON.stringify(OS)}`)
          const newHost = HostResolver.getInstance().resolve(args[0]);

          if (newHost) {
            if (session) {
              session.suspendCallbacks();
              setSessionStack([...sessionStack, session]);
              //or if not allowing stacked old sessions: session.clientDisconnected();
            }
            setSession(newHost.createNewSession());
          }
          else {
            sysOut("No host found with hostname: `" + args[0] + "'");
          }
        }
        else {
          sysOut("'connect' requires an argument; check the resolver for valid hostnames");
        }

      }
      else if( input === "opensesame" )
      {
        console.log("open sesame!")
        os.enableDebugTools();
      }
      else if( input === "closesesame" )
        {
          console.log("close sesame!")
          os.disableDebugTools();
        }
      else {
        if (session)
          session.executeCommand(input);
        //console.log("RESULT MSG [host: "+session?.host.hostname+"], msg ["+newMessage+"]");
      }

      setInput(''); // Clear input after submission
    }

    lastKeyPressed.current = e.key;
  };

  // Method to add new message to the terminal (with buffer management)
  const sysOut = (newMessage) =>
  {
    const messageWithMeta: MessageAndMetadata = { text: newMessage, host: session?.host || null };

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageWithMeta];
      // Trim the buffer if it exceeds the set buffer size
      if (updatedMessages.length > bufferSize) {
        return updatedMessages.slice(updatedMessages.length - bufferSize);
      }
      return updatedMessages;
    });
  };

  return (
    <div className="terminal">
      {/* Terminal output */}
      <div className="terminal-output" ref={scrollRef}>
        {messages.map((msgWithMeta, index) => (
          <div key={index} style={{ color: colorForHost(msgWithMeta.host?.fqdn) }}>{msgWithMeta.text}</div>
        ))}
      </div>

      {/* Terminal input with prompt */}
      <div className="terminal-input">
            <TerminalPrompt 
                session={session} 
                className="prompt" 
                environmentVersion={environmentVersion}
            />
            <TerminalInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                inputRef={inputRef}
            />
        </div>
    </div>
  );
};

export default Terminal;