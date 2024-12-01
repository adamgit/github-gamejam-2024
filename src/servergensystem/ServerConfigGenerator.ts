// ServerGenerator.ts
import {  Person } from './Person';
import { ReusePasswordStrategy } from './ReusePasswordStrategy';
import { ScenarioServer} from './ScenarioServer';
import { ServerBasedPasswordStrategy } from './ServerBasedPasswordStrategy';
import { UniquePasswordStrategy } from './UniquePasswordStrategy';
import {  UsernameGenerator } from "./UsernameGenerator";
import { FileContentsGenerator } from './FileContentsGenerator';
import { generatePeople } from './PeopleGenerator';

import { AccessLogsFileModule } from "./FileModules/AccessLogsFileModule";
import { AuditReportFileModule } from "./FileModules/AuditReportFileModule";
import { SystemConfigFileModule } from "./FileModules/SystemConfigFileModule";

import { HostResolver } from '../data/HostResolver';

export class ServerConfigGenerator {
    private serverCounter: number = 0;
    private allServers: ScenarioServer[] = [];
    private allPeople: Person[] = [];
    private fileContentsGenerator: FileContentsGenerator;
    private usernameGenerator: UsernameGenerator;
  
    constructor(
      fileContentsGenerator: FileContentsGenerator,
      usernameGenerator: UsernameGenerator
    ) {
      this.fileContentsGenerator = fileContentsGenerator;
      this.usernameGenerator = usernameGenerator;
    }
  
    /**
     * Generate the initial set of servers and people.
     * @param numInitialServers - Number of initial servers to generate.
     * @param getPeopleCount - Function to determine people-per-server.
     */
    initialize(
      numInitialServers: number,
      getPeopleCount: () => number = () => 1 // Default: 1 person per server
    ): ScenarioServer[]
    {
      // Step 1: Populate `allPeople` with enough `Person` objects for all servers
  const totalPeople = numInitialServers * getPeopleCount();

  const defaultStrategies = [
    new ReusePasswordStrategy(2),
    new ServerBasedPasswordStrategy(),
    new UniquePasswordStrategy(),
  ];
  this.allPeople = generatePeople(totalPeople, defaultStrategies)
  

  console.log(`Generated ${this.allPeople.length} people.`);

    // Create incomplete servers (without accounts or files)
    const servers = Array.from({ length: numInitialServers }, (_, i) => {
      this.serverCounter++;
      const numPeople = getPeopleCount();
      const people = this.allPeople.slice(i, i + numPeople);
      const serverFQDN = HostResolver.getInstance().generateFQDN_Commercial();
      return new ScenarioServer(serverFQDN, people, this.usernameGenerator);
    });

    // Add incomplete servers to the global list
    this.allServers.push(...servers);

    // Step 2: Populate accounts by generating passwords
    this.populateAccounts();

    // Step 3: Generate files for each server
    this.populateFiles();

    return this.allServers;
  }

  /**
   * Populate accounts by generating passwords for each person on each server.
   */
  private populateAccounts(): void {
    this.allServers.forEach((server) => {
      server.people.forEach((person) => {
        const password = person.generatePassword(server, this.allServers);
        server.addAccount({
          username: this.usernameGenerator.generate(person),
          password: password,
          strategy: person.passwordStrategy.constructor.name,
          person: person,
          server: server,
        });
      });
    });
  }

  /**
   * Generate files for each server based on their accounts and allServers context.
   */
  private populateFiles(): void {
    this.allServers.forEach((server) => {
      server.files = this.fileContentsGenerator.generate(server, this.allServers);
    });
  }

  
      /**
   * Generate and add a new server to the system.
   * @param getPeopleCount - Function to determine the number of people for the new server.
   */
  generateNewServer(getPeopleCount: () => number = () => Math.ceil(Math.random() * 3)): ScenarioServer {
    if (this.allPeople.length === 0) {
      throw new Error("No people available for server generation. Please initialize first.");
    }

  //  Generate people for the new server
  const numPeople = getPeopleCount();
  const defaultStrategies = [
    new ReusePasswordStrategy(2),
    new ServerBasedPasswordStrategy(),
    new UniquePasswordStrategy(),
  ];
  const people = Array.from({ length: numPeople }, () => {
    const firstName = `First${Math.random().toString(36).substring(2, 5)}`;
    const lastName = `Last${Math.random().toString(36).substring(2, 5)}`;
    const strategyIndex = Math.floor(Math.random() * defaultStrategies.length);
    return new Person(firstName, lastName, defaultStrategies[strategyIndex]);
  });

    // Create a new server with people but no accounts or files
    this.serverCounter++;
    
  
    const newServer = new ScenarioServer(
      `Server${this.serverCounter}`,
      people,
      this.usernameGenerator
    );

    // Step 2: Add the new server to the global list and populate accounts
    this.allServers.push(newServer);
    people.forEach((person) => {
      const password = person.generatePassword(newServer, this.allServers);
      newServer.addAccount({
        username: this.usernameGenerator.generate(person),
        password: password,
        strategy: person.passwordStrategy.constructor.name,
        person: person,
        server: newServer,
      });
    });

    // Step 3: Generate files for the new server
    newServer.files = this.fileContentsGenerator.generate(newServer, this.allServers);

    return newServer;
  }

  
    /**
     * Get all servers generated so far.
     */
    getAllServers(): ScenarioServer[] {
      return this.allServers;
    }
  }
