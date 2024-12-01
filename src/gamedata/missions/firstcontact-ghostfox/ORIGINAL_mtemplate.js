import { getMissionOS } from '../../../missionsystem/OSForMissions';
import { User } from '../../../backgroundservices/desktopservices/service-whassup';
import { createTemplateID } from '../../../types/mission';

// to create the needed server/host on the fly:
import { HostResolver } from '../../../data/HostResolver';
import { CredentialStoreLoginService } from '../../../backgroundservices/serverservices/service-login';
import { LoginWrapperShell } from '../../../data/shells';
import { BashShell } from '../../../data/BashShell';
import { RemoteHost, RemoteSession } from '../../../data/HostConnection';
import { SystemLogService } from '../../../backgroundservices/serverservices/service-syslog';

export default {
    templateID: createTemplateID("1stcontact-ghostfox"),
    title: "Contact (hacker)",
    blockedUntil: ['firstcontact'],
    //blockedBy: ['ACT2+'],
    //requiresMinReputation: 10,
    //successUnblocks: ['ACT2', 'ACT2+'],
    //successBlocks: ['ACT1'],
    successUnblocks: ['uncle2'],
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 1,
    reward: { reputation: 10, install: 'Rep' },

    // Initialize mission state and return variables
    createMission: () => {
        const chatService = getMissionOS().chatService;
    
      const npcGhostFox = new User({
          id: 'hacker.ghostfox',
          first: 'Ghost',
          last: 'Fox',
          online: true,
          tags: ['hacker']
      });
      chatService.addContact(npcGhostFox);
    
    /** Other variables */
      return {
        ghostFoxID: 'hacker.ghostfox'
      };
    },

    // Events that start when mission begins
    eventsInitial: {
        "start_mission": {
          actions: [
            { send: ["{{ghostFoxID}}", "Hey, you’ve been popping up on my radar lately. Let’s talk."] },
            { delay: [3000] },
            { send: ["{{ghostFoxID}}", "Some indiscreet hacking, huh? I’d like to see where this takes you."] },
            { schedule: 'respond_to_hacking'},
            { schedule: 'respond_to_player_keywords' },
            { schedule: 'respond_to_name'},
            { schedule: 'reveal_hacker_cred_app' },
          ]
        }
      },
    
      events: {
        "respond_to_hacking": {
          trigger: {
            subscribe: {
              target: 'service.chat',
              method: 'onMessageSentTo',
              conditionArgs: 'toId, message',
              condition: `{
                const keywords = ['hacking', 'passwords', 'innocent', 'wrong', 'how', 'nothing', 'discreet'];
                return toId === '{{ghostFoxID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
              }`,
            },
            onTrigger: {
              actions: [
                { delay: 500 },
                { send: ["{{ghostFoxID}}", "I have some backdoors on those servers, noticed what you were up to"] },
              ]
            }
          }
        },
    
        "respond_to_player_keywords": {
          trigger: {
            subscribe: {
              target: 'service.chat',
              method: 'onMessageSentTo',
              conditionArgs: 'toId, message',
              condition: `{
                const keywords = ['what', 'why', 'ghost', 'fox', 'recruit', 'hacker'];
                return toId === '{{ghostFoxID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
              }`,
            },
            onTrigger: {
              actions: [
                { delay: 1500 },
                { send: ["{{ghostFoxID}}", "Let’s just say I see potential in you."] },
                { delay: 2000 },
                { send: ["{{ghostFoxID}}", "Potential worth cultivating. But we’ll get to that later."] },
              ]
            }
          }
        },

        "respond_to_name": {
          trigger: {
            subscribe: {
              target: 'service.chat',
              method: 'onMessageSentTo',
              conditionArgs: 'toId, message',
              condition: `{
                const keywords = ['who', 'ghost', 'fox', ];
                return toId === '{{ghostFoxID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
              }`,
            },
            onTrigger: {
              actions: [
                { delay: 1500 },
                { send: ["{{ghostFoxID}}", "Why Ghost Fox? Not my real name :D I prefer to stay in the shadows."] },
              ]
            }
          }
        },
    
        "reveal_hacker_cred_app": {
          actions: [
            { delay: [10000] }, // Timeout before revealing the app
            { send: ["{{ghostFoxID}}", "You’ll find an app installed soon. It’s called the Hacker Cred Tracker."] },
            { delay: 2000 },
            { send: ["{{ghostFoxID}}", "It’ll show you how your reputation grows in the hacker community."] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "For now, consider this a token of interest. We’ll talk again."] },
            { missionSucceeded: "ghost_fox_intro" }
          ]
        }
      }
};
