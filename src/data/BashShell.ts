import { RemoteHost, RemoteSession } from "./HostConnection"
import { BaseShell, Shell } from "./Shell";
import { FileSystem } from '../filesystem/filesystem';
import { Path } from "../filesystem/path/path";
import { parseCommand, handleCommandOutput } from "./commandParser";
import { CompletionResult, TabCompleter } from './TabCompletion';

import { ls } from './shellbinaries/ls';
import { cd } from './shellbinaries/cd';
import { pwd } from './shellbinaries/pwd';
import { env } from './shellbinaries/env';
import { cat } from './shellbinaries/cat';
import { reboot } from './shellbinaries/reboot';
import { passwd } from './shellbinaries/passwd';
import { whoami } from './shellbinaries/whoami';
import { DefaultBinaryExecutor } from "./shellbinaries/DefaultBinaryExecutor";

export interface BinaryExecutor {
        execute: (args: string[], session: RemoteSession) => void | Promise<void>;
        getCompletions?: (precedingArgs: string[], partialArg: string, session: RemoteSession) => CompletionResult[];
    }

type BashHistory =
    {
        cmdHistory: string[];
        maxCommands: number;
        cmdIndex: number;
    }

// Implementation of a Bash-like shell
export class BashShell extends BaseShell implements Shell {
    private static readonly sessionData = new WeakMap<RemoteSession, BashHistory>();
    private static readonly AVAILABLE_BINARIES = {
        'ls': () => new ls(),
        'cd': () => new cd(),
        'pwd': () => new pwd(),
        'env': () => new env(),
        'cat': () => new cat(),
        'reboot': () => new reboot(),
        'passwd': () => new passwd(),
        'whoami': () => new whoami()
    } as const;

    private binaries: Map<string, BinaryExecutor>;
    private tabCompleter: TabCompleter;

    constructor(allowedBinaries?: string[]) {
        super('Bash');
        this.tabCompleter = new TabCompleter((binaryName, precedingArgs, partialArg, session) => {
                        const binary = this.binaries.get(binaryName);
                        return binary ? binary.getCompletions(precedingArgs, partialArg, session) : [];
                    });
        this.binaries = new Map();

        this.registerBinary('shellinfo', new class extends DefaultBinaryExecutor {
                        execute( args:string[], session:RemoteSession) {
                            session.sendOutput(`nGNU bash, version 17.2.9983-release (x86_128-pc-linux-gnu)`);
                        } // Empty implementation since this is just for tab completion
                    });

                    const outerThis = this;
this.registerBinary('help', new class extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession) {
        const availableCommands = Array.from(outerThis.binaries.keys()).sort().join(', ');
        session.sendOutput(`Available commands:\n\n${availableCommands}`);
    }
});

        
                    if (allowedBinaries) {
                        // Validate all requested binaries exist
                        const unknownBinaries = allowedBinaries.filter(name => 
                            !(name in BashShell.AVAILABLE_BINARIES)
                        );
                        if (unknownBinaries.length > 0) {
                            throw new Error(`Unknown binaries requested: ${unknownBinaries.join(', ')}`);
                        }
            
                        // Register only allowed binaries
                        allowedBinaries.forEach(name => {
                            this.registerBinary(name, BashShell.AVAILABLE_BINARIES[name]());
                        });
                    } else {
                        // Register all available binaries
                        Object.entries(BashShell.AVAILABLE_BINARIES).forEach(([name, factory]) => {
                            this.registerBinary(name, factory());
                        });
                    }
    }

    registerBinary(name: string, executor: BinaryExecutor): void {
        this.binaries.set(name, executor);
    }

    public handleCursorUp(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {
        var history = BashShell.sessionData.get(session);
        history.cmdIndex++;
        history.cmdIndex = Math.min(history.cmdIndex, history.maxCommands);

        session.setInputBuffer(history.cmdHistory[history.cmdIndex - 1]);
    }
    public handleCursorDown(inputBuffer: string, cursorPosition: number, session: RemoteSession): void {
        var history = BashShell.sessionData.get(session);
        history.cmdIndex--;
        history.cmdIndex = Math.max(history.cmdIndex, 1);

        session.setInputBuffer(history.cmdHistory[history.cmdIndex - 1]);
    }
    public handleTab(inputBuffer: string, cursorPosition: number, isSecondTab: boolean, session: RemoteSession): void
    {
        const context = this.tabCompleter.extractCompletionContext(inputBuffer, cursorPosition);
        const matches = this.tabCompleter.getCompletionMatches(context, Array.from(this.binaries.keys()), session);
        this.tabCompleter.applyCompletion(matches, context, isSecondTab, session);
    }


    connected(session: RemoteSession): void {
        const idealHomeFolder = Path.fromString(session.user.id === 'root' ? '/root' : '/home/' + session.user.id);

        // Auto switch to user's home-folder IFF it exists
        if (session.user && session.host.service(FileSystem)?.hasFolderAt(idealHomeFolder) && session.host.service(FileSystem)?.asFolderExecutable(idealHomeFolder, session.user)) {
            session.setEnvironmentVariableIfUnset("PWD", idealHomeFolder.toString());
            // and store it in an env-variable
            session.setEnvironmentVariable("HOME", idealHomeFolder.toString());
        }
        else
            session.setEnvironmentVariableIfUnset("PWD", '/');

        // Set a clean / empty command-history -- TODO: optionally add a saved per-user .bashrc to the filesystem that saves this and restores it here! 
        BashShell.sessionData.set(session, { cmdHistory: [], cmdIndex: 0, maxCommands: 10 });
    }
    async executeCommand(command: string, session: RemoteSession): Promise<void> {
        if (!this.checkBuiltinCommands(command, session)) {
            var history = BashShell.sessionData.get(session);
            history.cmdHistory.unshift(command);
            if (history.cmdHistory.length > history.maxCommands)
                history.cmdHistory = history.cmdHistory.slice(0, history.maxCommands);

            history.cmdIndex = 0;

            const parsedCommand = parseCommand(command);
            const binary = this.binaries.get(parsedCommand.command);

            console.log("will attempt to execute binary: " + JSON.stringify(binary))
            if (binary) {
                let capturedOutput = '';

                try {
                    /** Check if we need to re-route output */
                    if (parsedCommand.appendFile || parsedCommand.writeFile) {
                        console.log("parsedCommand gave: append = " + parsedCommand.appendFile + ", write = " + parsedCommand.writeFile);
                        const originalSendOutput = session.sendOutput;
                        session.sendOutput = (text: string) => { capturedOutput += text + '\n'; };

                        await binary.execute(parsedCommand.args, session);

                        // Restore original sendOutput
                        session.sendOutput = originalSendOutput;

                        // Handle output with file redirection
                        try {
                            await handleCommandOutput(
                                capturedOutput.trim(),
                                parsedCommand.appendFile,
                                parsedCommand.writeFile,
                                session
                            );
                        }
                        catch (error) {
                            if (capturedOutput.length > 0)
                                session.sendOutput(capturedOutput);

                            session.sendOutput(`Error executing ${parsedCommand.appendFile ? '>' : '>>'} with ${parsedCommand.command}: ${error.message}`)
                        }
                    }
                    else {
                        await binary.execute(parsedCommand.args, session);
                    }

                } catch (error) {
                    if (capturedOutput.length > 0)
                        session.sendOutput(capturedOutput);

                    session.sendOutput(`Error executing ${parsedCommand.command}: ${error.message}`)
                }
            }
            else {
                session.sendOutput(`bash: ${parsedCommand.command}: command not found`);
            }
        }
    }
}