// Person.ts
import { PasswordStrategy } from "./PasswordStrategy";
import { ScenarioServer } from './ScenarioServer';

/**
 * Represents an individual with a firstName, lastName, and a list of password-hint combinations
 *  generated by various PasswordSourcer instances.
 * 
 * Each Person is created using their name and one or more PasswordSourcers.
 */

export class Person {
  firstName: string;
  lastName: string;
  passwordStrategy: PasswordStrategy;

  constructor(firstName: string, lastName: string, passwordStrategy: PasswordStrategy) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.passwordStrategy = passwordStrategy;
  }

  generatePassword(server: ScenarioServer, allServers: ScenarioServer[]): string {
       const password = this.passwordStrategy.generatePassword(this, server, allServers);
       if (!password) {
        throw new Error(`Failed to generate a password for ${this.firstName} ${this.lastName}`);
      }
      return password;
     }
}