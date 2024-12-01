import { getMissionOS } from '../../OSForMissions';
import { createTemplateID } from '../../../types/mission';

export default
  {
    templateID: createTemplateID( "friend-change-medical-records" ),
    title: "Critical Help Request",
    blockedUntil: ['ACT1+'],
    //successUnblocks?: string[],
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 1,
    minSecondsBeforeRetryAfterFailure: 20,

    // Function to generate mission-specific variables
    createMission: () => {
      // Get list of available NPCs from chat service
      const chatService = getMissionOS().chatService;

      const availableNPCs = chatService.findContactsByTag( 'friend' );

      if (availableNPCs.length === 0) {
        throw new Error('No suitable NPCs available for mission');
      }

      // Select a random NPC from the filtered list
      const selectedNPC = availableNPCs[Math.floor(Math.random() * availableNPCs.length)];

      // Generate a plausible username based on NPC's name
      //const username = `${selectedNPC.firstName.toLowerCase()}_${selectedNPC.lastName.toLowerCase()}`;

      // Return all variables needed for this mission
      var friendUsername = selectedNPC.firstname.substring(0, 1) + selectedNPC.surname;
      return {
        friendUserID: selectedNPC.id,
        friendUsername: friendUsername,
        friendUsernameWrong: selectedNPC.firstname + "_" + selectedNPC.surname,
        friendPassword: `pwd_${Math.random().toString(36).slice(2, 8)}`,
        medicalRecordPathFolder: `/records/patients`,
        medicalRecordPathFile: friendUsername,
      };
    },

    eventsInitial: {
      "start": {
        actions: [
          { send: ['{{friendUserID}}', "Hey, are you there?"] },
          { delay: 2000 },
          { send: ['{{friendUserID}}', "I need a favour"] },
          { schedule: "await_response" }
        ]
      },
    },

    events: {
      "await_response": {
        timeout:
        {
          delay: 30000,
          onTimeout: {
            actions: [
              { send: ['{{friendUserID}}', "Nevermind"] },
              { missionFailed: "cancelled" }
            ]
          },
        },

        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['yes', 'ok', 'sure', 'what do you need'];
            return( toId === '{{friendUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { send: ['{{friendUserID}}', "Thanks! I really need some time off work... I was hoping you could help me get a few sick days..."] },
              { delay: 3000 },
              { schedule: "monitor_accountlockout" },
              { schedule: "monitor_accountlockout_other" },
              { schedule: "monitor_warnlockout" },
              { schedule: "monitor_filechange" },
              { schedule: "await_passwordcheck" },
              { schedule: 'incorrect_informsuccess' },
              { send: ['{{friendUserID}}', "Can you get into the healthcare system and update my record? I'll send you my login details. Just a sec"] },
              { delay: 2000 },
              { send: ['{{friendUserID}}', "Username: {{friendUsernameWrong}}\nPassword: {{friendPassword}}"] },
              
              { schedule: "impatient_informsuccess" },

              //{ schedule: "monitor_login_attempts" },
              //{ schedule: "monitor_security_level" },
              //{ schedule: "monitor_file_changes" },
              //{ schedule: "friend_pressure_message" }
            ]
          }
        }
      },

      "timed_mission": {
        timeout:
        {
          delay: 30000,
          onTimeout: {
            actions: [
              { send: ['{{friendUserID}}', "Nevermind"] },
              { missionFailed: "cancelled" }
            ]
          },
        },
      },

      "monitor_accountlockout": {
        trigger: {
          subscribe:
          {
            registryName: 'vitalsync.com',
            target: 'service.loginserver',
            method: 'onAccountLockout',
            conditionArgs: 'username',
            condition: '{ return username === \'{{friendUsername}}\'; }',
          },
          onTrigger: {
            actions: [
               { delay: 1000 },
               { send: ['{{friendUserID}}', 'FUUUU!']},
               { delay: 2000 },
               { send: ['{{friendUserID}}', 'What did you do!!']},
               { delay: 2000 },
               { send: ['{{friendUserID}}', 'IT just texted me - my account\'s been locked for suspicious activity!']},
               { delay: 1000 },
               { send: ['{{friendUserID}}', 'Thanks for nothing :(']},
               { missionFailed: "locked out of account" },
            ]
          }
        }
      },

      "monitor_accountlockout_other": {
        trigger: {
          subscribe:
          {
              registryName: 'vitalsync.com',
              target: 'service.loginserver',
              method: 'onAccountLockout',
              conditionArgs: 'username',
              condition: '{ return username !== \'{{friendUsername}}\'; }',
          },
          onTrigger: {
            actions: [
              { delay: 2000 },
              { send: ['{{friendUserID}}', "Whoa, the IT guys just messaged there's suspicious activity on the network"] },
              { delay: 500 },
              { send: ['{{friendUserID}}', "Is that you?"] }
            ]
          }
        }
      },

      "monitor_warnlockout": {
        trigger: {
          subscribe:
          {
            registryName: 'vitalsync.com',
            target: 'service.loginserver',
            method: 'onLoginFailure',
            conditionArgs: 'username',
            condition: '{ return username === \'{{friendUsername}}\' || username === \'{{friendUsernameWrong}}\'; }',
          },
          onTrigger: {
            actions: [
              { delay: 1000 },
              { send: ['{{friendUserID}}', "Make sure you type my password correctly. Too many wrong attempts might lock us out!"] },
            ]
          }
        }
      },

      "await_passwordcheck": {
        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['password', 'wrong', 'username', 'login' ];
            return( toId === '{{friendUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { delay: 1000 },
              { send: ['{{friendUserID}}', "Maybe I got the password wrong, lemme think"] },
              { delay: 3000 },
              { schedule: "await_passwordcheck2" },
              { send: ['{{friendUserID}}', "Oops, yeah, my bad. It’s probably [j_doe], try with an underscore. I always mix that up."] },
              { delay: 2000 },
              { send: ['{{friendUserID}}', "Is that working now?"] },
            ]
          }
        }
      },

      "await_passwordcheck2": {
        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['password', 'wrong', 'username', 'login' ];
            return( toId === '{{friendUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { delay: 1000 },
              { send: ['{{friendUserID}}', "Uh, I dunno."] },
              { delay: 1000 },
              { send: ['{{friendUserID}}', "Aren't you supposed to be the expert at this?"] },
              { delay: 2000 },
              { send: ['{{friendUserID}}', "Is it working now?"] },
            ]
          }
        }
      },

      "monitor_filechange": {
        trigger: {
          subscribe:
          {
            registryName: 'vitalsync.com',
            target: 'service.filesystem',
            method: 'onFileModified',
            conditionArgs: 'fileName, folderPath, fileContents, LoggedInUser',
            condition:`
          {
            console.log('fp: ['+folderPath.toString()+']');
            console.log('med path folder: '+'[{{medicalRecordPathFolder}}]');
            console.log('fn: ['+fileName+']');
            console.log('med path file: '+'[{{medicalRecordPathFile}}]');
            
            console.log('path + matches med path : '+(folderPath.toString() === '{{medicalRecordPathFolder}}') );
            console.log('name matches med  name: '+(fileName === '{{medicalRecordPathFile}}') );
            
           if( folderPath.toString() === '{{medicalRecordPathFolder}}' && fileName === '{{medicalRecordPathFile}}' )
        {
          const assertMissing = 'Current Diagnosis: None';
          const assertPresent = 'Current Diagnosis:';
          return fileContents.includes(assertPresent) && ! fileContents.includes(assertMissing);
        }
          else
          return false;
          }`,
          },
          onTrigger: {
            actions: [
              { cancel: 'incorrect_informsuccess' },
              { schedule: "await_informsuccess" },
            ]
          }
        }
      },

      "await_informsuccess": {
        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['done', 'worked', 'modified', 'ok', 'success' ];
            return( toId === '{{friendUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { cancel: "impatient_informsuccess" },
              { delay: 1000 },
              { send: ['{{friendUserID}}', "It's done? Thanks buddy!"] },
              { missionSucceeded: "patient record was updated OK" }
            ]
          }
        }
      },

      "incorrect_informsuccess": {
        trigger: {
          subscribe:
          {
            target: 'service.chat',
            method: 'onMessageSentTo',
            conditionArgs: 'toId, message',
            condition: `{
            const keywords = ['done', 'worked', 'modified', 'ok', 'success' ];
            return( toId === '{{friendUserID}}' && keywords.some(word => message.content.toLowerCase().includes(word.toLowerCase())) );
          }`,
          },
          onTrigger: {
            actions: [
              { delay: 1000 },
              { send: ['{{friendUserID}}', "It's done?"] },
              { delay: 2000 },
              { send: ['{{friendUserID}}', "What bro. No it ain't. HR still wants me in. Get on with it"] },
            ]
          }
        }
      },

      "impatient_informsuccess": {
        actions: [
          { delay: 2000 },
          { send: ['{{friendUserID}}', "Did it work? Tell me when it's done."] },
        ]
      },
    }
  };