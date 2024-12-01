import { FileSystem } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';

export class cat extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession): void {
    const fs = session.host.service(FileSystem);
    if (!fs) {
        session.sendOutput("Error: missing filesystem, 'cat' cannot function");
        return;
    }

    if (args.length === 0) {
        session.sendOutput("usage: cat <file> [file2 ...]");
        return;
    }

    const pwd = session.environmentVariables['PWD'] || '/';
    const effectiveUser = session.user ?? anonymousUser;

    // Process each file argument
    for (const arg of args) {
        //console.log("Processing ...: "+arg);

        const targetPath = Path.fromString(arg);
        const absolutePath = targetPath.isAbsolute
            ? targetPath
            : Path.fromString(pwd).append(targetPath);

        try {
            // Get file and output its contents
            //console.log(`..check readable: ${absolutePath}`)
            const file = fs.asFileReadable(absolutePath, effectiveUser);

            // Check if path exists and is a file
            if (!file) {
                session.sendOutput(`cat: ${arg}: No such file or directory`);
                continue;
            }

            //console.log(`..access contents: ${JSON.stringify(file)}`)
            // Output file contents
             // Handle binary vs text content
             if (file.content instanceof Uint8Array) {
                session.sendOutput(`${arg} is binary file`);
            } else {
                session.sendOutput(file.content);
            }
        } catch (error) {
            session.sendOutput(`cat: ${arg}: Error reading file`);
        }
    }
}
}