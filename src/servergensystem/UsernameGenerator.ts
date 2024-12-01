import {Person} from './Person'

/**
 * Base class for generating usernames. This is meant to be extended by specific implementations, such as FirstNameUsernameGenerator or InitialsAndRandomNumberUsernameGenerator.
 */
export class UsernameGenerator {
    generate(person: Person): string {
      throw new Error("Method not implemented.");
    }
  }
  
  export class FirstNameUsernameGenerator extends UsernameGenerator {
    generate(person: Person): string {
      return person.firstName.toLowerCase();
    }
  }
  
  export class FirstInitialLastNameUsernameGenerator extends UsernameGenerator {
    generate(person: Person): string {
      return `${person.firstName[0]}${person.lastName}`.toLowerCase();
    }
  }
  
  export class InitialsAndRandomNumberUsernameGenerator extends UsernameGenerator {
    generate(person: Person): string {
      const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
      return `${person.firstName[0]}${person.lastName[0]}${randomNum}`.toLowerCase();
    }
  }
  