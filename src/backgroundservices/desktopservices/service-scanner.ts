import { SubscribableEvent } from '../subscribable-event';
import { GameServices } from '../../gameServices';
import { FileContentsGenerator } from '../../servergensystem/FileContentsGenerator';
import { AccessLogsFileModule } from '../../servergensystem/FileModules/AccessLogsFileModule';
import { AppCredentialsFileModule } from '../../servergensystem/FileModules/AppCredentialsFileModule';
import { AuditReportFileModule } from '../../servergensystem/FileModules/AuditReportFileModule';
import { ServerConfigGenerator } from '../../servergensystem/ServerConfigGenerator';
import { FirstInitialLastNameUsernameGenerator } from '../../servergensystem/UsernameGenerator';
import { RemoteHost } from '../../data/HostConnection';
import { HostFromServer } from '../../data/HostFromServer';
import { ScenarioServer } from '../../servergensystem/ScenarioServer';

export class ServiceScanner {
    private allGeneratedServers: RemoteHost[] = [];
    private allGeneratedScenarioServers: ScenarioServer[] = [];

    public readonly onServersGenerated: SubscribableEvent<[RemoteHost[]]>;
    public readonly onScenarioServersGenerated: SubscribableEvent<[ScenarioServer[]]>;

    constructor() {
        this.onServersGenerated = new SubscribableEvent("onServersGenerated");
        this.onScenarioServersGenerated = new SubscribableEvent("onScenarioServersGenerated");
    }

    internalGenerateNewServers(numServers: number): RemoteHost[] {
        console.log(`SCAN generating ${numServers} NEW SERVERS...`);
        
        const fileContentsGenerator = new FileContentsGenerator([
            new AppCredentialsFileModule(1, 3),
            new AccessLogsFileModule(5, 15, 0.2),
            new AuditReportFileModule(),
        ]);
        
        const usernameGenerator = new FirstInitialLastNameUsernameGenerator();
        const serverGenerator = new ServerConfigGenerator(fileContentsGenerator, usernameGenerator);
        const initialServers = serverGenerator.initialize(numServers, () => Math.ceil(Math.random() * 3));

        // Store and notify about raw ScenarioServer objects first
        this.allGeneratedScenarioServers.push(...initialServers);
        this.onScenarioServersGenerated.invoke(initialServers);

        // Convert to RemoteHosts and handle as before
        const asHosts = HostFromServer.registerGeneratedServers(initialServers);
        this.allGeneratedServers.push(...asHosts);
        this.onServersGenerated.invoke(asHosts);

        return asHosts;
    }

    /**
     * Returns all ScenarioServer objects that have been generated
     */
    getAllGeneratedScenarioServers(): ScenarioServer[] {
        return [...this.allGeneratedScenarioServers];
    }

    /**
     * Returns the most recent ScenarioServer objects
     */
    getMostRecentScenarioServers(count: number = 1): ScenarioServer[] {
        return this.allGeneratedScenarioServers.slice(-count);
    }

    /**
     * Returns all RemoteHost servers that have been generated
     */
    getAllGeneratedServers(): RemoteHost[] {
        return [...this.allGeneratedServers];
    }

    /**
     * Returns the most recently generated RemoteHost servers
     */
    getMostRecentServers(count: number = 1): RemoteHost[] {
        return this.allGeneratedServers.slice(-count);
    }

    /**
     * Find a server by its FQDN
     */
    findServerByFQDN(fqdn: string): RemoteHost | undefined {
        return this.allGeneratedServers.find(server => server.fqdn === fqdn);
    }

    /**
     * Find a ScenarioServer by name
     */
    findScenarioServerByName(name: string): ScenarioServer | undefined {
        return this.allGeneratedScenarioServers.find(server => server.name === name);
    }

    /**
     * Returns the number of servers that have been generated
     */
    getGeneratedServerCount(): number {
        return this.allGeneratedServers.length;
    }

    /**
     * Clears all server history - mainly for testing purposes
     */
    clearServerHistory(): void {
        this.allGeneratedServers = [];
        this.allGeneratedScenarioServers = [];
    }
}