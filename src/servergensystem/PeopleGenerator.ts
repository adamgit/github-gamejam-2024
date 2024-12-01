//PeopleGenerator.ts

import { Person } from "./Person";
import { ReusePasswordStrategy } from "./ReusePasswordStrategy";
import { ServerBasedPasswordStrategy } from "./ServerBasedPasswordStrategy";
import { PasswordStrategy } from "./PasswordStrategy";
import { UniquePasswordStrategy } from "./UniquePasswordStrategy";

// in case none provided by caller
const defaultStrategies = [
    new ReusePasswordStrategy(2),
    new ServerBasedPasswordStrategy(),
    new UniquePasswordStrategy(),
  ];

const namesFirst : string[] = ['Alice', 'Bob', 'Claire', 'Daniel', 'Eric', 'Fred', 'George', 'Harriet', 'Issy', 'Janet', 'Karl', 'Mike', 'Nina', 'Olivia'];
const namesLast : string[] = ['Butcher', 'Baker', 'Cater', 'Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Johnson', 'Khan', 'Singh', 'Begum', 'Mason', 'Holmes', 'Mills', 'Jenkins', 'Lowe', 'Shah', 'Doyle', 'Akhtar', 'Quinn', 'Bibi', 'Lamb', 'Drover'];
  
/**
 * Generates a list of Person objects based on provided names and strategies.
 * 
 * @param names - Array of `{ firstName: string, lastName: string }` objects.
 * @param strategyProvider - (Optional) A function or array providing strategies:
 *   - If a function, it returns a strategy for each person.
 *   - If an array, its elements are assigned in order to the names.
 *   - If omitted, random strategies are assigned.
 */
export function generatePeople(
    totalPeople: number,
    strategies?: PasswordStrategy[]
  ): Person[] {
    
    const pStrategies = strategies ?? defaultStrategies;

    const result = Array.from({ length: totalPeople }, () => {
        const firstName = namesFirst[Math.floor(Math.random()*namesFirst.length)];
        const lastName = namesLast[Math.floor(Math.random()*namesLast.length)];
        const strategy = pStrategies[Math.floor(Math.random()*pStrategies.length)];
        return new Person(firstName, lastName, strategy);
      });

      return result;
  }