import {Person} from './Person'
import { Hint } from './types';

/**
 * Generates a password and related hints for a given Person.
 * It uses a predefined list of pet names and pet types to create a password in the format of PetName123 and generates contextual hints about the password.
 * 
 * TODO: this should be renamed to make it explicit it's only for pets
 * TODO: we need other implementations that don't use pets
 * TODO: the base class / type should NOT have anything to do with pets, it should be more generic, possibly even abstract
 */
export class PasswordSourcer {
  constructor(private petNames: string[], private petTypes: string[]) {}

  generate(person: Person): { password: string; hints: Hint[] } {
    const petType = this.petTypes[Math.floor(Math.random() * this.petTypes.length)];
    const petName = this.petNames[Math.floor(Math.random() * this.petNames.length)];
    const password = `${petName}123`;
    const hints: Hint[] = [
      { type: 'password', content: `${person.firstName} ${person.lastName}'s pet is a ${petType}.` },
      { type: 'password', content: `${person.firstName} ${person.lastName}'s password is their ${petType}'s name + "123".` },
      { type: 'password', content: `${petName} is ${person.firstName} ${person.lastName}'s beloved ${petType}.` },
    ];
    return { password, hints };
  }
}