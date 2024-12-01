import { PasswordStrategy } from "./PasswordStrategy";
import { Person } from "./Person";
import { ScenarioServer } from "./ScenarioServer";

export class PetNameGenerator extends PasswordStrategy {
   private petNames: string[];

   constructor(petNames: string[]) {
     super();
     this.petNames = petNames;
   }

   createPassword(person: Person): string {
     const petName = this.petNames[Math.floor(Math.random() * this.petNames.length)];
     return `${petName}123`;
   }

   generateFileText(server: ScenarioServer, person: Person, fileType: string): string | null {
     /* eg. but not good copy:
     if (fileType === "access_logs") {
       return `Hint: ${person.firstName}'s password may relate to a pet's name.`;
     }
     */
     if (fileType === "audit_report") {
        return `ALERT: Password is a common pet's name.`;
      }
     return null;
   }
 }