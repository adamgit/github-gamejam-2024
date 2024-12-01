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
    templateID: createTemplateID("guess-family-password"),
    title: "Want a pet",
    //blockedUntil: ['ACT1','unclewifi'],
    blockedUntil: ['uncle2'],
    blockedBy: ['ACT2+'],
    successUnblocks: ['ACT2', 'ACT2+'], // trigger th
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 2,
    reward: { bytecoins: 1, reputation: 10 },

    // Initialize mission state and return variables
    createMission: () => {
        const chatService = getMissionOS().chatService;
    
      const npcUncle = new User({
          id: 'players.uncle',
          first: 'Uncle',
          last: '',
          online: true,
          tags: ['family', 'uncle']
      });
      chatService.addContact(npcUncle);
      const npcCousin = new User({
        id: 'players.cousin',
        first: 'Cousin',
        last: 'Rick',
        online: true,
        tags: ['family', 'uncleson']
    });
    chatService.addContact(npcCousin);
    
    /** Other variables */
    const animals = ['puppy', 'cat', 'snake', 'dog'];
    const petindex = Math.floor(Math.random()*animals.length);
    const petanimal = animals[petindex];

    const names_puppy = ['luna', 'bella', 'daisy', 'milo', 'max', 'teddy', 'charlie'];
    const names_dog = ['luna', 'bella', 'daisy', 'milo', 'max', 'teddy', 'charlie'];
    const names_cat = ['willow', 'poppy', 'molly', 'millie', 'rosie', 'loki', 'leo'];
    const names_snake = ['noodles', 'medusa', 'nagini', 'severus', 'slinky', 'slithers', 'slytherin'];
    const petnamelist = petindex == 0 ? names_puppy : petindex == 1 ? names_cat : petindex == 2 ? names_snake : names_dog;
    
    const petname = petnamelist[Math.floor(Math.random()*petnamelist.length)];
    const petnamehint = `It starts with ${petname.charAt(0)}`;
    const petnamelengthhint = `${petname.length}`;

    /** Configure the server - or RECONFIGURE it if already exists */
    const server = HostResolver.getInstance().fetchOrCreateTaggedHost('uncle1', (resolver) => {
        // choose a semi-random IP for the server:
        const hostname = resolver.generateFQDN_Home();
  
        // Add the home router host with syslog service
        const routerHost2 = new RemoteHost(hostname, new LoginWrapperShell(new BashShell(['reboot', 'passwd'])));
        routerHost2.registerService('service.syslog', new SystemLogService());
        /** Create a login service with custom username and password */
        routerHost2.registerService('service.loginserver', new CredentialStoreLoginService([{ username: 'admin', password: 'factory-1234' }], routerHost2));
        return routerHost2;
    });
    /** ... CHANGE the root password... */
    console.log("------------- changing username/password for 'admin' to : "+petname+" on host: "+server.fqdn);
    server.service( CredentialStoreLoginService ).replacePassword('admin', petname );

      return {
          uncleUserID: npcUncle.id,
          cousinUserID: npcCousin.id,
          router_hostname: server.fqdn,
          desirednewpassword: 'unclecoolest',
          petanimal: petanimal,
          petname: petname,
          petnamehint: petnamehint,
          petnamelengthhint: petnamelengthhint,
      };
    },

    // Events that start when mission begins
    eventsInitial: {
        "start_mission": {
          actions: [
            {send: ["{{uncleUserID}}", "Rick's being an idiot again"]},
            {delay: [1000]},
            {send: ["{{uncleUserID}}", "He changed the admin password, and disabled the factory-reset"]},
            {delay: [1000]},
            {send: ["{{uncleUserID}}", "Says it's his 'revenge'"]},
            {delay: [1000]},
            {send: ["{{cousinUserID}}", "Pop's being a dick again. Don't help him"]},
            {delay: [2000]},
            {send: ["{{uncleUserID}}", "I grounded him but he still won't give it to me. Can you change the password again? This time make it ..."]},
            {delay: [200]},
            {send: ["{{uncleUserID}}", "... um ... "]},
            {delay: [500]},
            {send: ["{{uncleUserID}}", "'unclecoolest'"]},
            { schedule: 'respond_unclerouter' },
            { schedule: 'respond_cousinopener' },
            { schedule: 'respond_cousinthreat' },
            { schedule: 'respond_unclepet' },
            { schedule: 'npc_attempts_newpassword' },
          ]
        }
      },

    // All possible events in the mission
    events: {
        "respond_unclerouter": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['address', 'hostname', 'router', 'connect', 'server', 'how', 'help' ];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{uncleUserID}}", "Oh, the address is {{router_hostname}}"] },
                    ]
                }
            }
        },

        "respond_cousinopener": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['hi', 'what', 'password', 'why', 'did', 'change', 'help'];
            return toId === '{{cousinUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "He promised!"] },
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "If I can't have a pet, he can't have internet"] },
                        { delay: 4000 },
                        { send: ["{{cousinUserID}}", "Do you even know what he promised me?"] }
                    ]
                }
            }
        },

        "respond_unclepet": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['pet', 'promise' ];
            return toId === '{{uncleUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{uncleUserID}}", "What?"] },
                        { delay: 1000 },
                        { send: ["{{uncleUserID}}", "Is this about that stupid {{petanimal}}?"] },
                        { delay: 1000 },
                        { send: ["{{uncleUserID}}", "Tell him to fix it now or he's grounded for a month!"] }
                    ]
                }
            }
        },

        "respond_cousinthreat": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['grounded', '{{petanimal}}'];
            return toId === '{{cousinUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "OK. FINE."] },
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "I'm not gonna tell you."] },
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "But it's one of the common names."] },
                        { delay: 2000 },
                        { send: ["{{cousinUserID}}", "Ask google!"] },
                        { schedule: 'respond_cousinhelp1' },
                    ]
                }
            }
        },

        "respond_cousinhelp1": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['help', '{{petanimal}}', 'password', 'name'];
            return toId === '{{cousinUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "There aren't that many {{petanimal}} names."] },
                        { delay: 5000 },
                        { send: ["{{cousinUserID}}", "{{petnamehint}}"] },
                        { schedule: 'respond_cousinhelp2' },
                    ]
                }
            }
        },

        "respond_cousinhelp2": {
            trigger: {
                subscribe: {
                    target: 'service.chat',
                    method: 'onMessageSentTo',
                    conditionArgs: 'toId, message',
                    condition: `{
            const keywords = ['letters', 'long', 'many', 'help', 'hint', 'come on', 'please', 'try' ];
            return toId === '{{cousinUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
          }`,
                },
                onTrigger: {
                    actions: [
                        { delay: 1000 },
                        { send: ["{{cousinUserID}}", "Fine. It's got {{petnamelengthhint}} letters in the name"] },
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
                                            hostname: '{{router_hostname}}',
                                            target: 'service.loginserver',
                                            method: 'attemptLogin',
                                            args: ['admin', '{{desirednewpassword}}']
                                        }
                                    },
                                    [ // Then actions
                                        { send: ["{{uncleUserID}}", "You did it! The WiFi is back. Thanks, kiddo!"] },
                                        { missionSucceeded: "router_password_reset" }
                                    ],
                                    [ // Else actions
                                        { send: ["{{uncleUserID}}", "Nope, that didn't work. That kid!!!"] },
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
