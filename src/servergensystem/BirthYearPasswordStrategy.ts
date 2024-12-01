import { PasswordStrategy } from "./PasswordStrategy";
import { Person } from "./Person";
import { ScenarioServer } from "./ScenarioServer";
import { Hint } from "./types";

export class BirthYearPasswordStrategy extends PasswordStrategy {
    createPassword(person: Person): string {
      const birthYear = 1980 + Math.floor(Math.random() * 30); // Random year 1980-2010
      return `${birthYear}`;
    }
  
    generateFileText( server: ScenarioServer, person: Person, fileType: string): string | null {
        /**
        { type: "password", content: `${person.firstName}'s password is a year.` },
        { type: "password", content: `Try their birth year.` },
      ];*/
      return null;
    }
  }