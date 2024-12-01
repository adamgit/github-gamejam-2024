import { FileSystem } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { LoggedInUser } from '../../data/HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { BinaryExecutor } from '../BashShell';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';

export class cd extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession): void {
    const fs = session.host.service(FileSystem);
    if (!fs) {
        session.sendOutput("Error: missing filesystem, 'cd' cannot function");
        return;
    }

    // Get current working directory
    const pwd = session.environmentVariables['PWD'] || '/';
    const effectiveUser = session.user ?? anonymousUser;

    // Handle special case: no args means cd to home directory
    if (args.length === 0) {
        const homeDir = session.environmentVariables['HOME'] || '/';
        session.setEnvironmentVariable('PWD', homeDir);
        return;
    }

    // Get target path from argument
    const targetPath = Path.fromString(args[0]);
    
    // Resolve absolute path if relative was provided
    const absolutePath = targetPath.isAbsolute
        ? targetPath
        : Path.fromString(pwd).append(targetPath);

    try {
        // Check if the path exists and is a directory
        if (!fs.asFolderExecutable(absolutePath, effectiveUser)) {
            if (fs.asFileStattable(absolutePath, effectiveUser)) {
                session.sendOutput(`cd: not a directory: ${args[0]}`);
            } else {
                session.sendOutput(`cd: no such file or directory: ${args[0]}`);
            }
            return;
        }

        // Check if we have execute permission on the target directory
        fs.asFolderExecutable(absolutePath, effectiveUser);

        // Check if we have execute permission on every directory in the path
        let currentPath = Path.root();
        for (const segment of absolutePath.segments) {
            currentPath = currentPath.append(segment);
            fs.asFolderExecutable(currentPath, effectiveUser);
        }

        // If all checks pass, update PWD
        session.setEnvironmentVariable('PWD', absolutePath.toString());

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('permission denied')) {
                session.sendOutput(`cd: permission denied: ${args[0]}`);
            } else {
                session.sendOutput(`cd: ${args[0]}: ${error.message}`);
            }
        } else {
            session.sendOutput(`cd: cannot access '${args[0]}': No such file or directory`);
        }
    }
}
}