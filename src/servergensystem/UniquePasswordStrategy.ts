import { Hint } from './types';
import { Person } from './Person';
import { PasswordStrategy } from "./PasswordStrategy";
import { ScenarioServer } from './ScenarioServer';

export class UniquePasswordStrategy extends PasswordStrategy {
  createPassword(person: Person): string {
    return `${Math.random().toString(36).substring(2, 8)}123`;
  }

  generateFileText( server: ScenarioServer, person: Person, fileType: string): string | null {
    if (fileType === "audit_report") {
      return `Unique passwords are used for ${person.firstName}.`;
    }
    return null;
  }
}
