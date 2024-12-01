import { anonymousUser } from '../../filesystem/filesystem';
import { Path } from '../../filesystem/path/path';
import { RemoteSession } from '../HostConnection';
import { FileSystem } from '../../filesystem';
import { CompletionResult } from '../TabCompletion';

export function listFilesAndFoldersInCurrentFolder(partialArg: string, session: RemoteSession): CompletionResult[] {
    const fs = session.host.service(FileSystem);

    if (!fs) {
        return [];
    }
    else {
        if (partialArg.includes('/')) {
            // If partialArg contains a '/', it means we've already done one completion
            // and are looking for contents of that folder
            const basePath = session.environmentVariables['PWD'] || '/';
            /* The filesystem wants absolute paths for folder-listing, so we ensure it gets them,
            // .. but: tab-completion requires that whatever we return literally startSwith( partialArg )
            // .. so: if we 'make absolute' the path for FS lookup, we have to 'not alter it' for final response
            */
            const willPrependBasePath = !partialArg.startsWith('/');
            let folderPathString;
            let outputRelativeFolderPathString;

            if( willPrependBasePath ) // relative partial-completion - append to the PWD
            {
            const lastSlash = partialArg.lastIndexOf('/');
            const relativeSubpath = partialArg.slice(0,lastSlash);

            folderPathString = (willPrependBasePath ? basePath : '' ) + relativeSubpath;
            outputRelativeFolderPathString = relativeSubpath;
            }
            else // absolute partial-completion - ignore the PWD and just overwrite it
            {
                const lastSlash = partialArg.lastIndexOf('/');
                const relativeSubpath = partialArg.slice(1,lastSlash);

                folderPathString = '/'+relativeSubpath;
                outputRelativeFolderPathString = folderPathString;
            }

            // Get contents of folderPath and prefix each with 'folderPath/'
            //console.log(`PARTIAL FOLDER had a / (was: '${partialArg}'), so looking for contents of folder from basePath '${basePath}', final folderpath '${folderPathString} .. outputRel: ${outputRelativeFolderPathString}'`)
            return getFolderContents( folderPathString, session)
            .map(item => ({
                // NB special case when we're searching the root folder - which is '/', where normal folders are '/name' (i.e. root is trailing slash, others are NOT)
                value: `${outputRelativeFolderPathString}${outputRelativeFolderPathString.endsWith('/') ? '' : '/'}${item.value}`,
                chainable: item.chainable
            }));
        } else {
            // First completion - just return folder names
            return getFolderContentsAtCurrentPath(session);
        }
    }
}

function getFolderContents( path:string, session:RemoteSession) : CompletionResult[]
{
    const effectiveUser = session.user ?? anonymousUser;

    let absolutePath = Path.fromString(path);
    //console.log(`original PWD path: ${Path.fromString(pwd)}, parially completed path: ${partialPath} (from arg: ${partialArg}), ultimate path: ${absolutePath}`)

    const fs = session.host.service(FileSystem);

    if (!fs) {
        return [];
    }
    try {
        // Check if the target is actually a folder, LOL
        if (fs.hasFolderAt(absolutePath)) {
            if (fs.canStatAt(absolutePath, effectiveUser)) {
                const folder = fs.asFolderStattable(absolutePath, effectiveUser);

                const output: CompletionResult[] = [];


                //console.log(`Children in folder: ${absolutePath} = ${JSON.stringify(folder.children)} ... raw: ${folder.children} / ${folder.children.keys.length}`);
                // Add all entries
                for (const [name, child] of folder.children)
                {
                    //console.log(` ... received [${name}, ${child}] as a child of folder.children`)
                    const isFolder = fs.asFolderStattable(child.path, effectiveUser) !== null;
                    const formattedName = isFolder ? `${name}/` : name;

                    output.push({ value: `${formattedName}`, chainable: isFolder });
                }

                return output;
            }
            else console.log(`Can't stat folder: ${absolutePath}`);
        }
        else console.log(`Not-a-folder: ${absolutePath}, path was: '${path}', PWD was: '${session.environmentVariables['PWD']}'`);
    } catch (error) {
        return [];
    }

    return [];
}

function getFolderContentsAtCurrentPath(session:RemoteSession) : CompletionResult[]
{
    const pwd = session.environmentVariables['PWD'] || '/';
    const effectiveUser = session.user ?? anonymousUser;

    let absolutePath = Path.fromString(pwd);
    return getFolderContents( pwd, session );
}

export abstract class DefaultBinaryExecutor {
    abstract execute(args: string[], session: RemoteSession): void | Promise<void>;

    getCompletions(precedingArgs: string[], partialArg: string, session: RemoteSession): CompletionResult[] {
        //console.log(`partial: '${partialArg}', precedingargslast: '${precedingArgs.length > 0 ? precedingArgs[precedingArgs.length - 1] : ''}', pwd: ${session.environmentVariables['PWD'] || '/'}`)
        return listFilesAndFoldersInCurrentFolder(partialArg, session);
/*
        const result = listFilesAndFoldersInCurrentFolder(partialArg, session);

        console.log(`Final response list-and-folders, we get: ${JSON.stringify(result)}`);
        return result;*/
    }
}