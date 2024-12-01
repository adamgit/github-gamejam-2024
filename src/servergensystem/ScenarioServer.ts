import { FileContentsGenerator } from './FileContentsGenerator';
import { Person } from './Person'
import { UsernameGenerator } from './UsernameGenerator'
import { ServerAccount, ServerFile, Hint } from './types';

/**
 * Represents a generated server with accounts and files - but is about data generation/configuration,
 * NOT the actual live game data (i.e. it's only used for building-up the data, with all the
 * mutually dependent chains of data and facts - and its not a complete valid 'server' on its own).
 * 
 * Has to be converted/upgraded into a RemoteHost to be used in-game
 */
export class ScenarioServer {
    name: string;
    people: Person[]; // Associated people
    accounts: ServerAccount[];
    files: ServerFile[];
    
    /**
     * Note that we typically CANNOT create the accounts and files immediately,
     * we typically generate a batch of empty servers, then use those to generate
     * the accounts, then use both gropus to generate the files
     */
    constructor(
        name: string,
        people: Person[],
        private usernameGenerator: UsernameGenerator
      ) {
        this.name = name;
        this.people = people;
        this.accounts = [];
        this.files = [];
      }

      /**
   * Add an account to the server.
   */
  addAccount(account: ServerAccount): void {
    this.accounts.push(account);
  }
}