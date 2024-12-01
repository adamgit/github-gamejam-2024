import { ScenarioServer } from "./ScenarioServer";
import { ServerAccount } from "./types";

export class AccountProcessor {
    /**
     * Filters and processes accounts with server-specific variation.
     * @param allServers - All servers in the system.
     * @param currentServer - The server for which the file is being generated.
     * @param includeAccount - A function that determines whether an account should be included.
     * @returns Filtered accounts and their associated notes.
     */
    static getAccountsForServer(
        allServers: ScenarioServer[],
        currentServer: ScenarioServer,
    ): {
        currentServerAccounts: ServerAccount[];
        otherServersAccounts: ServerAccount[];
        allAccounts: ServerAccount[];
    } {
        const allAccounts = allServers.flatMap((srv) => srv.accounts);
    
        const currentServerAccounts: ServerAccount[] = [];
        const otherServersAccounts: ServerAccount[] = [];
    
        for (const account of allAccounts) {
            
                if (currentServer.accounts.includes(account)) {
                    currentServerAccounts.push(account);
                } else {
                    otherServersAccounts.push(account);
                }
            
        }
    
        return {
            currentServerAccounts,
            otherServersAccounts,
            allAccounts,
        };
    }

    static getRandomSubset(
        accounts: ServerAccount[],
        probability: number,
        minCount: number = 0,
        requireMinOrError: boolean = false
      ): ServerAccount[] {
        if (requireMinOrError && minCount > accounts.length) {
          throw new Error(
            `Requested minimum count (${minCount}) is greater than the number of available accounts (${accounts.length}).`
          );
        }
      
        // Randomly include items based on the probability
        const subset = accounts.filter(() => Math.random() < probability);
      
        // If the subset is less than the minimum required, pad it with more items from the original set
        if (subset.length < minCount) {
          const remainingAccounts = accounts.filter((account) => !subset.includes(account));
          const additionalItems = remainingAccounts.slice(0, minCount - subset.length);
          return [...subset, ...additionalItems];
        }
      
        return subset;
      }
}