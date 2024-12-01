// missions/wifi-reset/mtemplate.js

import { getMissionOS } from '../../../missionsystem/OSForMissions';
import { User } from '../../../backgroundservices/desktopservices/service-whassup';
import { createTemplateID } from '../../../types/mission';

export default {
  templateID: createTemplateID( "wifi_reset_mission"),
    title: "Home WiFi Reset",
    //blockedUntil: ['ACT1+'],
    blockedBy: ['ACT1+'],
    successUnblocks: ['ACT1', 'ACT1+'],
    maxConcurrentInstances: 1,
    //reward: { install: 'ByteWallet' },

    // Initialize mission state and return variables
    createMission: () => {

        const chatService = getMissionOS().chatService;
        
        const npcMom = new User({
            id: 'players.mom',
            first: 'Mom',
            last: '',
            //avatar: '/assets/ghostfox.png',
            online: false,
            tags: ['family', 'mom']
          });
        chatService.addContact( npcMom );


      return {
        router_password: "securewifi2024",
        router_hostname: "homerouter.local",
        momUserID: npcMom.id,
      };
    },
  
    // Events that start when mission begins
    eventsInitial: {
      "start_mission": {
        actions: [
          {
            send: ["{{momUserID}}", "The WiFi isn't working! I NEED my shows! Can you fix it?"]
          },
          {
            delay: [2000]
          },
          {
            send: ["{{momUserID}}", "You're the techie. Please? You said something about taking a photo of it last time."]
          },
          { schedule: 'initial_hint'},
          { schedule: 'incorrect_informsuccess' },
          { schedule: 'check_router_reboot'}
        ]
      }
    },

    // All possible events in the mission
    events: {
      'initial_hint':
      {
        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['how', 'where', 'find', 'what' ];
            return( toId === '{{momUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { delay: 1000 },
              { send: ["{{momUserID}}", "I don't know"] },
              { delay: 1000 },
              { send: ["{{momUserID}}", "Your documents maybe?"] },
              { delay: 1000 },
              { send: ["{{momUserID}}", "Isn't it saved on that computer we bought you?"] },
            ]
          }
        }
      },
        /** scheduled when success achieved, but player hasn't informed the NPC yet */
        "await_informsuccess": {
            trigger: {
              subscribe:
              {
                target: 'service.chat',
                method: 'onMessageSentTo',
                conditionArgs: 'toId, message',
                condition: `{
                const keywords = ['done', 'worked', 'working', 'try', 'modified', 'ok', 'rebooted', 'did it', 'fixed', 'yes' ];
                return( toId === '{{momUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
              }`,
              },
              onTrigger: {
                actions: [
                  // if NPC can nag the player: { cancel: "impatient_informsuccess" },
                  { delay: 1000 },
                  { send: ["{{momUserID}}", "You're amazing! The WiFi's back. Thank you! 🌟"] },
                  { missionSucceeded: "rooter rebooted" }
                ]
              }
            }
          },
    
          /** scheduled from start, so that if player claims success to NPC they get slapped down - will be cancelled when the mission data has been achieved */
          "incorrect_informsuccess": {
            trigger: {
              subscribe:
              {
                target: 'service.chat',
                method: 'onMessageSentTo',
                conditionArgs: 'toId, message',
                condition: `{
                const keywords = ['done', 'worked', 'working', 'modified', 'rebooted', 'did it', 'fixed' ];
                return( toId === '{{momUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
              }`,
              },
              onTrigger: {
                actions: [
                  { delay: 1000 },
                  { send: ['{{momUserID}}', "It's done?"] },
                  { delay: 2000 },
                  { send: ['{{momUserID}}', "No it isn't. Try again honey."] },
                ]
              }
            }
          },


      "check_router_reboot": {
        trigger: {
          subscribe: {
            registryName: "homerouter.local",
            target: "service.syslog",
            method: "onSystemEvent",
            conditionArgs: "event",
            condition: "return event.type === 'reboot'"
          },
          onTrigger: {
            actions: [
              { cancel: 'initial_hint'},
                { cancel: 'incorrect_informsuccess'},
              {
                delay: [2000]
              },
              {
                send: ["{{momUserID}}", "Is it working? Google is doing something"]
              },
              { schedule: 'await_informsuccess'}
            ]
          }
        },
      },
    }
    
  };