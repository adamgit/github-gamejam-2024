import { Person } from "./Person";
import { ScenarioServer } from "./ScenarioServer";

// types.ts

  export interface ServerFile {
    name: string;
    content: string;
  }
  
  export interface ServerData {
    name: string;
    accounts: ServerAccount[];
    files: string[];
  }
  
  export interface Hint {
    type: string; // e.g., 'password', 'username', 'general'
    content: string;
  }

  export interface ServerAccount {
       username: string;
       password: string;
       strategy: string;
       person: Person;
       server: ScenarioServer; // Server this account is being created on
     }
    
     export interface ServerFile {
       name: string;
       content: string;
     }

