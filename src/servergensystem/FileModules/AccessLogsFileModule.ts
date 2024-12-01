import { FileModule } from "../FileModule";
import { PasswordStrategy } from "../PasswordStrategy";
import { ScenarioServer } from "../ScenarioServer";
import { ServerFile } from "../types";
import { AccountProcessor } from '../AccountProcessor'

export class AccessLogsFileModule extends FileModule {
    private minLogEntries: number;
    private maxLogEntries: number;
    private otherServerAccountProbability: number;
  
    constructor(minLogEntries: number, maxLogEntries: number, otherServerAccountProbability: number) {
      super();
      this.minLogEntries = minLogEntries;
      this.maxLogEntries = maxLogEntries;
      this.otherServerAccountProbability = otherServerAccountProbability;
    }
  
    generateFile(server: ScenarioServer, allServers: ScenarioServer[]): ServerFile[] {
      const { currentServerAccounts, otherServersAccounts } = AccountProcessor.getAccountsForServer(
        allServers,
        server
      );
  
      // Determine the number of log entries to generate
      const numLogEntries = Math.floor(
        Math.random() * (this.maxLogEntries - this.minLogEntries + 1) + this.minLogEntries
      );

      // Choose which accounts to include
      const selectedLocals = AccountProcessor.getRandomSubset(currentServerAccounts, 0.95, 1);
      const selectedForeigns = AccountProcessor.getRandomSubset(otherServersAccounts, 0.5, 2);
  
      const logEntries: string[] = [];
  
      for (let i = 0; i < numLogEntries; i++) {
        const useOtherServerAccount = Math.random() < this.otherServerAccountProbability;
        let logEntry: string;
  
        if (useOtherServerAccount && selectedForeigns.length > 0) {
          // Pick a random account from other server accounts
          const account = selectedForeigns[Math.floor(Math.random() * selectedForeigns.length)];
          const hint = account.person.passwordStrategy?.generateFileText(server, account.person, "access_logs");
  
          logEntry = hint
            ? `Other server user ${account.username}: ${hint}`
            : `Other server user ${account.username} attempted to log in.`;
        } else if (selectedLocals.length > 0) {
          // Pick a random account from current server accounts
          const account = selectedLocals[Math.floor(Math.random() * selectedLocals.length)];
  
          logEntry = `User ${account.username} logged in.`;
        } else {
          // Fallback for when there are no accounts available
          logEntry = `Unknown user attempted to access the system.`;
        }
  
        logEntries.push(logEntry);
      }
  
      return [
        {
          name: `access_logs.txt`,
          content: logEntries.join("\n"),
        },
      ];
    }
  }