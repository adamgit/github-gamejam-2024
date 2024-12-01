import { FileModule } from "../FileModule";
import { PasswordStrategy } from "../PasswordStrategy";
import { ScenarioServer } from "../ScenarioServer";
import { ServerFile } from "../types";
import { AccountProcessor } from '../AccountProcessor'

export class SystemConfigFileModule extends FileModule {
    generateFile(server: ScenarioServer, allServers: ScenarioServer[]): ServerFile[] {
        const { currentServerAccounts, otherServersAccounts, allAccounts } = AccountProcessor.getAccountsForServer(
            allServers,
            server
        );

        // Choose which accounts to include
        const selectedLocals = AccountProcessor.getRandomSubset(currentServerAccounts, 0.95, 1);
        const selectedForeigns = AccountProcessor.getRandomSubset(otherServersAccounts, 0.5, 1);

        // Generate configuration content
        const configContent = [];
        for (const account of allAccounts) {
            const notes = [];
            const note = account.person.passwordStrategy.generateFileText(server, account.person, "system_config");
                if (note) {
                    notes.push(note);
                }
            configContent.push(`Account: ${account.username}\nNotes:\n${notes.join("\n")}`);
        }

        return [
            {
                name: `${server.name}_system_config.txt`,
                content: `System Configuration for ${server.name}\n\n${configContent.join("\n")}`,
            },
        ];
    }
}
