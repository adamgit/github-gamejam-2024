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
    templateID: createTemplateID("final-ghostfox"),
    title: "Final (hacker)",
    maxConcurrentInstances: 1,
    maxSuccessCompletions: 1,
    requiresMinReputation: 55,
    
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
            { send: ["{{ghostFoxID}}", "Nice! You got enough rep! Time to join us in the big time."] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "(GAME WON)"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "(ran out of time to make more missions, sorry)"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "(come join us in the discord - hit the ? icon)"] },
            { delay: 1500 },
            { send: ["{{ghostFoxID}}", "/GhostFox: OUT!"] },
            { delay: 1500 },
            { sharescannedcreds: '{{ghostFoxID}}' },
            { missionSucceeded: "ghost_fox_final" }
          ]
        }
      },
    
      events: {
      }
};
