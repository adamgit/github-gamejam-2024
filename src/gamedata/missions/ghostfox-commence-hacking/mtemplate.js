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
    templateID: createTemplateID("2ndcontact-ghostfox"),
    title: "Contact-2 (hacker)",
    blockedUntil: ['ACT2'],
    successUnblocks: ['uncle2'],
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 1,
    reward: { reputation: 10, install: ['Secrets','Scan'] },

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
            { send: ["{{ghostFoxID}}", "OK, I'm gonna give you some REAL tools..."] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "One will scan servers and look for ones that have unsecured login ports"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "Connect to some of them. Try any usernames/passwords you've learnt, see if you can get in"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "If you get in? Go looking for files - use 'cd', 'ls' to move around - and 'cat' to read a named file"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "Most servers run BASH, so you can hit 'tab' and it'll autocomplete folder names and filenames"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "Another tool ... this one uses my backdoor on your desktop hehehehe"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "It'll detect each time you successfully find a username/password and memorise it for you"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "Then you can login to that server again at any time in the future with 1 click"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "All the real hackers are lazy :D we're not gonna type everything every time haahahha"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "Every new server you login to will earn you Rep."] },
            { delay: 500 },
            { send: ["{{ghostFoxID}}", "I'll be back when you hit 55"] },
            { delay: 1000 },
            { send: ["{{ghostFoxID}}", "/GhostFox: OUT!"] },
            { delay: 1500 },
            { sharescannedcreds: '{{ghostFoxID}}' },
            { missionSucceeded: "ghost_fox_2nd" }
          ]
        }
      },
    
      events: {
      }
};
