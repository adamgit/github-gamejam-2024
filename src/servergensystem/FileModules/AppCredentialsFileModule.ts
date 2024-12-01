import { FileModule } from "../FileModule";
import { PasswordStrategy } from "../PasswordStrategy";
import { ScenarioServer } from "../ScenarioServer";
import { ServerAccount, ServerFile } from "../types";
import { AccountProcessor } from '../AccountProcessor'

interface FileFiller {
    generateEntry: (account: ServerAccount, server: ScenarioServer) => string;
    generatedFilename: string;
}

export class AppCredentialsFileModule extends FileModule {
    private minLogEntries: number;
    private maxLogEntries: number;

    constructor(minLogEntries: number, maxLogEntries: number) {
        super();
        this.minLogEntries = minLogEntries;
        this.maxLogEntries = maxLogEntries;
    }

    /**
     * Uses the supplied server's hostname to choose a file-format - e.g. if it has "mail" in the hostname
     * then it will return a mailserver-like file.
     * 
     * @param serverName 
     * @returns 
     */
    private fileFormatFiller(serverName: string): FileFiller {
        if (
            serverName.toLowerCase().indexOf('database') > 0
            || serverName.toLowerCase().indexOf('db') > 0
            || serverName.toLowerCase().indexOf('sql') > 0
            || serverName.toLowerCase().indexOf('mongo') > 0
        ) {
            return ({
                generatedFilename: 'db_credentials.txt',
                generateEntry: (acc: ServerAccount, s: ScenarioServer) =>
                    `DB_HOST=${s.name}
SERVER_USER=${acc.username}
PASSWORD=${acc.password}\n`
            });
        }
        else if (
            serverName.toLowerCase().indexOf('mail') > 0
            || serverName.toLowerCase().indexOf('mx') > 0
        ) {
            return ({
                generatedFilename: 'mail_config.ini',
                generateEntry: (acc: ServerAccount, s: ScenarioServer) =>
                    `SMTP_HOST=${s.name}
   USER=${acc.username}
   PASS=${acc.password}\n`,
            });
        }
        else if (
            serverName.toLowerCase().indexOf('auth') > 0
            || serverName.toLowerCase().indexOf('backup') > 0
        ) {
            return ({
                generatedFilename: 'oauth_credentials.json',
                generateEntry: (acc: ServerAccount, s: ScenarioServer) =>
                    `{
  "client_id": "${acc.username}",
  "client_secret": "${acc.password}",
  "auth_server": "${s.name}"
}\n`,
            });

        }
        else if (
            serverName.toLowerCase().indexOf('cdn') > 0
        ) {
            return ({
                generatedFilename: 'cdn_config.xml',
                generateEntry: (acc: ServerAccount, s: ScenarioServer) =>
                    `<cdn>
    <url>https://${s.name}/static/images/</url>
    <auth_secret>${acc.password}</auth_secret>
    <expiry>2029-12-31</expiry>
</cdn>\n`,
            });

        }
        else {
            return ({
                generatedFilename: 'oauth_credentials.json',
                generateEntry: (acc: ServerAccount, s: ScenarioServer) =>
                    `{
  "client_id": "${acc.username}",
  "client_secret": "${acc.password}",
  "auth_server": "${s.name}"
}\n`,
            });
        }
    }

    /**
     * Returns all the servers represented among these accounts
     * @param accounts 
     */
    foreignServers( accounts:ServerAccount[] )
    {
        const uniqueServers = new Set<ScenarioServer>();

    for (const account of accounts) {
        if (account.server) {
            uniqueServers.add(account.server);
        }
    }

    return Array.from(uniqueServers);
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

        /**
         * Unusually complex, since we have to choose our file format based on a
         * single TARGET server (not this server) and then only show accounts on
         * that foreign server
         */

        // Choose which foreign server to generate creds for
        const serversWithAtLeastOneAccount = this.foreignServers(otherServersAccounts);
        const selectedServer = serversWithAtLeastOneAccount[Math.floor(Math.random()*serversWithAtLeastOneAccount.length)];

        // Choose which accounts to include
        const selectedForeigns = selectedServer.accounts;

        // Choose a file-format based on the server-name
        const fileFiller = this.fileFormatFiller(selectedServer.name);

        const logEntries: string[] = [];

        for (let i = 0; i < numLogEntries; i++) {
            let logEntry: string;

            if (selectedForeigns.length > 0) {
                // Pick a random account from other server accounts
                const account = selectedForeigns[Math.floor(Math.random() * selectedForeigns.length)];
                logEntry = fileFiller.generateEntry(account, account.server);
            }
            else {
                // Fallback for when there are no accounts available
                logEntry = `[uninstalled]`;
            }

            logEntries.push(logEntry);
        }

        return [
            {
                name: fileFiller.generatedFilename,
                content: logEntries.join("\n"),
            },
        ];
    }
}