// missions/wifi-reset/mtemplate.js

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
  templateID: createTemplateID("wifi_reset_uncle_mission"),
  title: "Uncle's WiFi Reset",
  blockedUntil: ['ACT1'],
  blockedBy: ['ACT2+'],
  successUnblocks: [/*'unclewifi',*/ 'firstcontact'], 
  maxConcurrentInstances: 1,
  maxSuccessCompletions: 1,
  reward: { bytecoins: 1, reputation: 10, install: 'ByteWallet' },

  // Initialize mission state and return variables
  createMission: () => {
    const chatService = getMissionOS().chatService;

    const server = HostResolver.getInstance().fetchOrCreateTaggedHost('uncle1', (resolver) => {
      console.log("hostCreator>>> will choose a hostname")
            // choose a semi-random IP for the server:
            const hostname = resolver.generateFQDN_Home();

            console.log(`hostCreator>>> (host: ${hostname}), will create a RemoteHost from that`)
            // Add the home router host with syslog service
            const routerHost2 = new RemoteHost(hostname, new LoginWrapperShell(new BashShell(['reboot', 'passwd'])));
            console.log(`hostCreator>>> (host: ${hostname}, RH: ${routerHost2}), willadd services`)
            routerHost2.registerService('service.syslog', new SystemLogService());
            /** Create a login service with custom username and password */
            routerHost2.registerService('service.loginserver', new CredentialStoreLoginService([{ username: 'admin', password: 'factory-1234' }], routerHost2));
            return routerHost2;
        });

        if( ! server )
          throw new Error("Catastrophic error trying to fetch-or-create tagged host for uncle-server");

        const npcUncle = new User({
            id: 'players.uncle',
            first: 'Uncle',
            last: '',
            online: true,
            tags: ['family', 'uncle']
        });
        chatService.addContact(npcUncle);

        console.log(`setting up uncle mission with serger = ${server}, hostname: ${server?.hostname}, uncle = ${npcUncle}`);
        return {
            uncleUserID: npcUncle.id,
            router_hostname: server.fqdn,
            desirednewpassword: 'unclecool',
        };
  },

  // Events that start when mission begins
  eventsInitial: {
    "start_mission": {
      actions: [
        {
          send: ["{{uncleUserID}}", "Hey kiddo - I tried to be smart and change my router password. Now I can't remember what I changed it to! Can you help?"]
        },
        {delay: [2000]},
        {send: ["{{uncleUserID}}", "I did a 'factory reset'. Is that bad?"]},
        {delay: [4000]},
        {send: ["{{uncleUserID}}", "I'll pay you 1 BTC if you can get me back online. The router hostname is {{router_hostname}}"]},
        { delay: 500 },
        {send: ["{{uncleUserID}}", "I need the new password to be: '{{desirednewpassword}}'"]},
        
        { schedule: 'respond_to_help_query' },
        { schedule: 'respond_router_model_query' },
        { schedule: 'npc_attempts_newpassword' },

        { delay: 2000 },
        {send: ["{{uncleUserID}}", "Tell me when its done"]},
      ]
    }
  },

  // All possible events in the mission
  events: {
    "respond_to_help_query": {
      trigger: {
        subscribe: {
          target: 'service.chat',
          method: 'onMessageSentTo',
          conditionArgs: 'toId, message',
          condition: `{
            const keywords = ['how', 'what', 'remember', 'change', 'did', 'help'];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
        },
        onTrigger: {
          actions: [
            { delay: 1000 },
            { send: ["{{uncleUserID}}", "The router must have some kind of backup password!"] },
            { delay: 1000 },
            { send: ["{{uncleUserID}}", "Ugh, this is so frustrating!"] },
            { schedule: 'respond_cry_for_help' },
          ]
        }
      }
    },

    "respond_router_model_query": {
      trigger: {
        subscribe: {
          target: 'service.chat',
          method: 'onMessageSentTo',
          conditionArgs: 'toId, message',
          condition: `{
            const keywords = ['model', 'router', 'details', 'type', 'backup'];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
        },
        onTrigger: {
          actions: [
            { delay: 1500 },
            { send: ["{{uncleUserID}}", "It's the same model as the one your Mom got."] },
            { delay: 2500 },
            { send: ["{{uncleUserID}}", "Fine, it's a WR-2800AA."] }
          ]
        }
      }
    },

    "respond_cry_for_help": {
      trigger: {
        subscribe: {
          target: 'service.chat',
          method: 'onMessageSentTo',
          conditionArgs: 'toId, message',
          condition: `{
            const keywords = ['help', 'hint', 'idea'];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
        },
        onTrigger: {
          actions: [
            { delay: 1500 },
            { send: ["{{uncleUserID}}", "I dunno, you're the tech expert"] },
            { delay: 2500 },
            { send: ["{{uncleUserID}}", "You've got the manual, right?"] }
          ]
        }
      }
    },

    "npc_attempts_newpassword": {
      trigger: {
        subscribe: {
          target: 'service.chat',
          method: 'onMessageSentTo',
          conditionArgs: 'toId, message',
          condition: `{
            const keywords = ['changed', 'new', 'done'];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
        },
        onTrigger: {
          actions: [
            
            {
                    conditional: 
                    [
                        {
                            resolve:
                            {
                                hostname:'{{router_hostname}}',
                                target:'service.loginserver',
                                method:'attemptLogin',
                                args:['admin', '{{desirednewpassword}}']
                            }
                        },
                        [ // Then actions
                            { send: ["{{uncleUserID}}", "You did it! The WiFi is back. Thanks, kiddo!"] },
                            { missionSucceeded: "router_password_reset" }
                        ],
                        [ // Else actions
                            { send: ["{{uncleUserID}}", "Nope, that didn't work. Try again!"] },
                            { delay: 500 },
                            { schedule: 'npc_attempts_newpassword' }
                        ]
                    ]
              }
                    
          ]
        }
      }
    }
  }
};
