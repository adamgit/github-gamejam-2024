// commandParser.ts
import { RemoteSession } from "./HostConnection";
import { anonymousUser, FileSystem } from '../filesystem/filesystem';
import { Path } from "../filesystem/path/path";

interface ParsedCommand {
    command: string;
    args: string[];
    appendFile?: string; // Added for ">>" operator
    writeFile?: string;  // Added for ">" operator
}

export function parseCommand(commandLine: string): ParsedCommand {
    // First check for ">>" (append) - check this BEFORE single ">" to avoid mismatching
    const appendMatch = commandLine.match(/(.*?)\s*>>\s*(.*)/);
    if (appendMatch) {
        const [_, baseCommand, fileName] = appendMatch;
        const [cmd, ...args] = baseCommand.trim().split(/\s+/);
        return {
            command: cmd,
            args,
            appendFile: fileName.trim()
        };
    }
    // Then check for ">" (write)
    const writeMatch = commandLine.match(/(.*?)\s*>\s*(.*)/);
    if (writeMatch) {
        const [_, baseCommand, fileName] = writeMatch;
        const [cmd, ...args] = baseCommand.trim().split(/\s+/);
        return {
            command: cmd,
            args,
            writeFile: fileName.trim()
        };
    }
    
    // No redirection
    const [cmd, ...args] = commandLine.trim().split(/\s+/);
    return { command: cmd, args };
}

export async function handleCommandOutput(
    output: string,
    appendFile: string | undefined,
    writeFile: string | undefined,
    session: RemoteSession
): Promise<void> {
    if (!appendFile && !writeFile) {
        session.sendOutput(output);
        return;
    }

    const fs = session.host.service(FileSystem);
    if (!fs) {
        session.sendOutput("Error: No filesystem available");
        return;
    }

    const effectiveUser = session.user ?? anonymousUser;
    const currentDir = Path.fromString(session.environmentVariables["PWD"] || "/");
    const filePath = currentDir.append(Path.fromString(appendFile || writeFile!));

    try {
        if (writeFile) {
            // Overwrite file
            console.log("atempting write to file:"+filePath);
            fs.writeFile(filePath, output + "\n", effectiveUser);
        } else {
            // Append to file
            const existingContent = fs.asFileReadable(filePath, effectiveUser) ?
                fs.readFile(filePath, effectiveUser) :
                "";
                console.log("atempting append to file:"+filePath);
            fs.writeFile(filePath, existingContent + output + "\n", effectiveUser);
        }
    } catch (error)
    {
        console.log(`Attempted target filepath: ${filePath} --- existing file? ${fs.asFileReadable(filePath, effectiveUser)} ---`)
        session.sendOutput(`Error ${writeFile ? 'writing to' : 'appending to'} file: ${error.message}`);
    }
}