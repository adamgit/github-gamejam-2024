import { FileModule } from "../FileModule";
import { PasswordStrategy } from "../PasswordStrategy";
import { ScenarioServer } from "../ScenarioServer";
import { ServerFile } from "../types";
import { AccountProcessor } from '../AccountProcessor'

export class AuditReportFileModule extends FileModule {
    generateFile(server: ScenarioServer, allServers: ScenarioServer[]): ServerFile[] {
      const {currentServerAccounts, otherServersAccounts, allAccounts } = AccountProcessor.getAccountsForServer(
        allServers,
        server
      );

      // Choose which accounts to include
      const selectedLocals = AccountProcessor.getRandomSubset(currentServerAccounts, 1, 1);
      
      // Generate report content
      const reportContent = [];
      for (const account of selectedLocals) {
        const customisedReport = account.person.passwordStrategy.generateFileText( server, account.person, "audit_report");
        reportContent.push(
            customisedReport ? `Account: ${account.username} (${account.person.firstName} ${account.person.lastName}\n${customisedReport}`
            : `Account: ${account.username}\nPassword: ${account.password}\nStrategy: ${account.strategy}\n`
        );
      }
  
      return [
        {
          name: `audit_report.txt`,
          content: `Audit Report for ${server.name}\n\n${reportContent.join("\n")}`,
        },
      ];
    }
  }
  