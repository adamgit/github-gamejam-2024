import { Person } from "./Person";
import { ScenarioServer } from "./ScenarioServer";

export abstract class PasswordStrategy {
    /**
     * This is an abstract method that defines the fundamental logic for generating a password.
Implementation: Each concrete strategy must implement this method to define how passwords are generated. For example:

     * @param person 
     */
    abstract createPassword(person: Person): string;

    abstract generateFileText( server: ScenarioServer, person: Person, fileType: string): string | null;

    /**
     *  This method orchestrates password generation while incorporating contextual constraints.
Implementation: Provided in the base class, it uses createPassword as a helper to generate new passwords, but also enforces strategy-specific rules, such as:
     ()
     * @param person 
     * @param server 
     * @param allServers 
     * @returns 
     */
    generatePassword(person: Person, server: ScenarioServer, allServers: ScenarioServer[]): string {
        // Enforce strategy-specific reuse checks
        const existingPasswords = allServers.flatMap((srv) =>
            srv.accounts
                .filter((account) => account.person === person)
                .map((account) => account.password)
        );
        if (existingPasswords.length > 0) {
            return existingPasswords[0]; // Example reuse logic
        }
        const newPassword = this.createPassword(person);
        return newPassword;
    }
    
}