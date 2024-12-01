import { FileSystem, Node, Folder } from '../../filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { LoggedInUser } from '../../data/HostConnection';
import { anonymousUser } from '../../filesystem/filesystem';
import { formatPermissions } from '../../filesystem/types/permissions';
import { DefaultBinaryExecutor } from './DefaultBinaryExecutor';

export class ls extends DefaultBinaryExecutor {
    execute(args: string[], session: RemoteSession): void {
   const fs = session.host.service(FileSystem);

   if( ! fs )
   {
    session.sendOutput("Error: missing filesystem, 'ls' cannot function");
   }
   else
   {
   const pwd = session.environmentVariables['PWD'] || '/';
   const effectiveUser = session.user ?? anonymousUser;

   // Handle path argument if provided, otherwise use PWD
   const targetPath = args.length > 0 
       ? Path.fromString(args[0])
       : Path.fromString(pwd);

   // Resolve absolute path if relative was provided
   const absolutePath = targetPath.isAbsolute 
       ? targetPath 
       : Path.fromString(pwd).append(targetPath);

   try
   {
    // Check if the path points to a file
    if( fs.hasFileAt( absolutePath ))
    {
        if (fs.canStatAt(absolutePath, effectiveUser)) {
            // For files, just output the single file's information
            const file = fs.asFileStattable(absolutePath, effectiveUser);
            const permissions = formatPermissions(file.permissions);
            const owner = file.permissions.owner;
            const group = file.permissions.group;
            const name = file.path.name;
            
            session.sendOutput(`-${permissions} ${owner} ${group} ${name}`);
            return;
        }
        else
            session.sendOutput(`ls: cannot access '${args[0]}': No such file or directory`);
    }
    else if( fs.hasFolderAt( absolutePath ))
    {

    // ...otherwise: it's a folder (or its unrecognized/no permissions and counts as a failure)
    if( fs.canStatAt(absolutePath, effectiveUser))
    {
       const folder = fs.asFolderStattable(absolutePath, effectiveUser);

       const output: string[] = [];

        // Add "." entry (current directory)
        const dotEntry = `drwxr-xr-x ${folder.permissions.owner.padEnd(9, ' ')} ${folder.permissions.group.padEnd(9, ' ')} .`;
        output.push(dotEntry);

        // Add ".." entry (parent directory)
        // Handle root directory case specially
        if (! fs.isRoot(absolutePath) ) {
            const parentFolder = fs.asFolderStattable(absolutePath.parent, effectiveUser);
            // Pad the owner and group names to at least 9 characters
    const owner = parentFolder.permissions.owner.padEnd(9, ' ');
    const group = parentFolder.permissions.group.padEnd(9, ' ');
            const dotDotEntry = `drwxr-xr-x ${owner} ${group} ..`;
            output.push(dotDotEntry);
        } else {
            /* just don't output for /
            // At root, the ".." entry has the same permissions as "."
            const dotDotEntry = `drwxr-xr-x ${folder.permissions.owner} ${folder.permissions.group} ..`;
            output.push(dotDotEntry);
            */
        }

        // Add all other entries
        for (const [name, child] of folder.children) {
            const isFolder = fs.asFolderStattable(child.path, effectiveUser) !== null;
            const prefix = isFolder ? "d" : "-";
            const permissions = formatPermissions(child.permissions);
            const owner = child.permissions.owner.padEnd(9, ' ');
            const group = child.permissions.group.padEnd(9, ' ');
            
            const formattedName = isFolder ? `${name}/` : name;
            
            output.push(`${prefix}${permissions} ${owner} ${group} ${formattedName}`);
        }

        if (output.length > 0) {
            // Sort all entries except "." and ".." which should stay at the top
            const [dot, dotDot, ...rest] = output;
            session.sendOutput([dot, dotDot, ...rest.sort()].join('\n'));
        }
    }
    else
    {
        console.log(`ls could't stat path: '${absolutePath}' as user: '${effectiveUser}`);
    session.sendOutput(`ls: cannot access '${args[0]}': No such file or directory`);
    }
    }
   } catch (error) {
    console.error(`ERROR with ls ... ${error}`);
       session.sendOutput(`ls: cannot access '${args[0]}': No such file or directory`);
   }
}
}
}