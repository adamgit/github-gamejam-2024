// ReusePasswordStrategy.ts
import { Hint } from './types';
import { Person } from './Person';
import { ScenarioServer } from './ScenarioServer';
import { PasswordStrategy } from "./PasswordStrategy";

export class ReusePasswordStrategy extends PasswordStrategy {
    private passwordPool: Set<string> = new Set();
    private totalPasswords: number;
  
    constructor(totalPasswords: number) {
      super();
      if (totalPasswords < 1) {
        throw new Error("Total passwords must be at least 1");
      }
      this.totalPasswords = totalPasswords;
    }
  
    createPassword(person: Person): string {
      const newPassword = `${Math.random().toString(36).substring(2, 8)}123`;
      this.passwordPool.add(newPassword);
      return newPassword;
    }
  
    generateFileText( server: ScenarioServer, person: Person, fileType: string): string | null {
      if (fileType === "audit_report") {
        return `DANGER: Evidence found that ${person.firstName} is reusing this password on other servers.`;
      }
      return null;
    }
  }