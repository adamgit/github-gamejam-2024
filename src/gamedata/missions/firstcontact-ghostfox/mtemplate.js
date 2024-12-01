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
    successUnblocks: ['uncle2'],
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 1,
    reward: { reputation: 10, install: ['Rep','HackerMon'] },

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
            { send: ["{{ghostFoxID}}", "Some indiscreet hacking, huh? You triggered my intrusion-detector on that router."] },
            { schedule: 'reveal_intrusion_scanner'},
          ]
        }
      },
    
      events: {
    "reveal_intrusion_scanner": {
          actions: [
            { delay: [1000] }, // Timeout before revealing the app
            { send: ["{{ghostFoxID}}", "I'll send you an intrusion monitor, just a basic freebie."] },
            { delay: 4000 },
            { send: ["{{ghostFoxID}}", "It'll watch your desktop - if you see an intrusion, make sure you lockdown before its too late"] },
            { delay: 2500 },
            { send: ["{{ghostFoxID}}", "Nothing TOO bad will happen if you miss it - you're still too small a target for anyone that cares"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "...gimme a sec..."] },
            { delay: 1000 },
            { send: ["{{ghostFoxID}}", "Keep helping your family, if you don't get caught I'll have more for you..."] },
            // REMOVED FOR NOW FOR SIMPLICITY { schedule:'reveal_hacker_cred_app' }
            { missionSucceeded: "ghost_fox_intro" }
          ]
        },
/*
        "reveal_hacker_cred_app": {
          actions: [
            { send: ["{{ghostFoxID}}", "You’ll find an app installed soon. It’s called the Hacker Cred Tracker."] },
            { delay: 2000 },
            { send: ["{{ghostFoxID}}", "It’ll show you how your reputation grows in the hacker community."] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "For now, consider this a token of interest. We’ll talk again."] },
            { missionSucceeded: "ghost_fox_intro" }
          ]
        }
          */
      }
};
