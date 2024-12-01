// ServerBasedPasswordStrategy.ts
import { Hint } from './types';
import { Person } from './Person';
import { PasswordStrategy } from "./PasswordStrategy";
import { ScenarioServer } from './ScenarioServer';

export class ServerBasedPasswordStrategy extends PasswordStrategy {
    createPassword(person: Person): string {
        return `${Math.random().toString(36).substring(2, 8)}123`;
    }

    generateFileText( server: ScenarioServer, person: Person, fileType: string): string | null {
        if (fileType === "system_config") {
            return `Password strategy for ${person.firstName} is based on server-specific rules.`;
        }
        if (fileType === "audit_report") {
            return `Semi-strong passwords are used for ${person.firstName}.`;
          }
        return null;
    }
}