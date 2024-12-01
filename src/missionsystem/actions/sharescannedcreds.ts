import { getMissionOS } from '../OSForMissions';
import { ActionHandler, MissionContext } from '../../types/mission';
import { replaceTemplateVariables } from '../template-variables';
import { RemoteHost } from '../../data/HostConnection';
import { ScenarioServer } from '../../servergensystem/ScenarioServer';

/*****************
 * This is a MASSIVE hack because I'm running out of time
 * 
 * It does a one-off connection between 'servers being auto-generated in background'
 * and
 * 'sending a message to the player with that info'
 */
export default class sharescannedcredsAction implements ActionHandler
{
  private static hasInformedPlayer = false;

  async execute(params: string, context: MissionContext): Promise<void>
  {
    const target = params;
    const resolvedTarget = replaceTemplateVariables(target, context.variables);
    //console.log(`-------converted '${target}' to '${resolvedTarget}'`)

    const scanner = getMissionOS().scanService;
    if (!scanner) {
      throw new Error("Scanner service not available");
    }

    if( sharescannedcredsAction.hasInformedPlayer )
    {
      console.log("can't run this action more than once EVER - by design");
      return;
    }

    const servers = scanner.getAllGeneratedScenarioServers();
    if (servers.length > 0) {
      // We already have servers, process them immediately
      this.processServersAndInformPlayer(servers, resolvedTarget, context);
      return;
    }

      // Wait for the first batch of servers to be generated
      // If no servers yet, set up a one-time listener for when they arrive
      console.log("WARN: firing an async addlistener callback in desperate last-minute hack...");
    scanner.onScenarioServersGenerated.addListener((newServers) =>
    {
      this.processServersAndInformPlayer(newServers, resolvedTarget, context);
    });
  }

  private processServersAndInformPlayer(
    servers: ScenarioServer[],
    userIDSharingCredentials: string,
    context: MissionContext
  ): void {
    if (sharescannedcredsAction.hasInformedPlayer) {
      console.error("This should be impossible...23jdksfs");
      return;
    }

    console.log(`....async: received some servers! ${servers.length} of them`);

    
    const numberOfServersToPick = 3;

    // Randomly select 'numberOfServersToPick' servers or fewer if the list is too short
    const selectedServers = servers
      .sort(() => Math.random() - 0.5) // Shuffle the servers array
      .slice(0, Math.min(numberOfServersToPick, servers.length));

    // Process each selected server
    selectedServers.forEach(server => {
      if (server.accounts.length > 0) {
        // Randomly pick one account from the server
        const randomAccount = server.accounts[Math.floor(Math.random() * server.accounts.length)];
        const { username, password } = randomAccount;

        // Send the message to the player via the chat service
        getMissionOS().chatService.addMessageFrom(
          userIDSharingCredentials,
          `here's the server creds...${server.name} - ${username} - ${password}`
        );
      } else {
        console.warn(`Server ${server.name} has no accounts to share.`);
      }
    });

    
    
    sharescannedcredsAction.hasInformedPlayer = true;
  }
}