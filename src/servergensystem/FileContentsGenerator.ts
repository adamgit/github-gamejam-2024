// FileContentsGenerator.ts
import { ScenarioServer } from "./ScenarioServer";
import { ServerAccount, ServerFile } from "./types";
import { FileModule } from "./FileModule";
import { PasswordStrategy } from "./PasswordStrategy";

export class FileContentsGenerator {
    private fileModules: FileModule[];

    constructor(fileModules: FileModule[]) {
        this.fileModules = fileModules;
    }

    generate(server: ScenarioServer, allServers: ScenarioServer[]): ServerFile[] {
        return this.fileModules.flatMap((module) =>
            module.generateFile(server, allServers)
        );
    }
}