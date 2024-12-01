import { PasswordStrategy } from "./PasswordStrategy";
import { ScenarioServer } from "./ScenarioServer";
import { ServerFile } from "./types";

 export abstract class FileModule {
   abstract generateFile(server: ScenarioServer, allServers: ScenarioServer[]): ServerFile[];
 }