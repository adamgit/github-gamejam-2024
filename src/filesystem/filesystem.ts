import { SubscribableEvent } from '../backgroundservices/subscribable-event';
import { File, Folder, Node } from './types/node';
import { FilePermissions } from './types/permissions';
import { LoggedInUser } from '../data/HostConnection';
import { Path } from './path/path';
import { createFileImpl, createFolderImpl, FSInit_createFileImpl_IgnorePermissions, FSInit_createFolderImpl_IgnorePermissions } from './operations/create';
import { readFileImpl } from './operations/read';
import { appendFileImpl, writeFileImpl } from './operations/write';
import { deleteFileImpl, deleteFolderImpl } from './operations/delete';
import { moveImpl } from './operations/move';
import { copyImpl } from './operations/copy';
import { canExecImpl, canReadImpl, existsImpl, isFileImpl, isFolderImpl, listFolderImpl } from './operations/query';
import { changeGroupImpl, changeOwnerImpl, changePermissionsImpl } from './operations/permissions_change';
import { FileSystemFolder, FileSystemFile } from './types/internalnodes';


/**
 * Lets you initialize a filesystem (folders, structure, initial files) from a JS object
 */
/** Simplifies FileSystemInit/FileSystemInitNode - but by-design duplicates FileSystemFile (and could be merged into it) */
type FileContent = string | Uint8Array;
/** Clever use of semi-recursive definition: content's "|" path allows you to specify one-layer deep WITHOUT the "content:" tag in the child */
interface FileSystemInitMetadata {
    content: FileContent;  // Only for files
    owner?: string;
    group?: string;
}

type FileSystemInitNode = 
    | FileContent  // Simple file
    | FileSystemInitMetadata  // File with metadata
    | { [path: string]: FileSystemInitNode };  // Directory

interface FileSystemInit {
    [path: string]: FileSystemInitNode;
}


export const anonymousUser: LoggedInUser = {
    id: "anonymous",
    groups: [],
}
/**
 * Things I would like to improve about this system (Claude.ai badly designed it, despite my best efforts):
 * 1. given a Path, and the Root folder for a filesystem, it runs an over-complex "findNode()" method;
 *    it is also literally incapable of doing 'cd ..'
 */
export class FileSystem {
    private root: Folder;

    readonly onFileCreated = new SubscribableEvent<[Path, LoggedInUser]>("onFileCreated");
    readonly onFileModified = new SubscribableEvent<[string, Path, string | Uint8Array, LoggedInUser]>("onFileModified"); //condition: `( fileName, folderPath, fileContents, LoggedInUser )
    readonly onFileDeleted = new SubscribableEvent<[Path, LoggedInUser]>("onFileDeleted");
    readonly onFileMoved = new SubscribableEvent<[Path, LoggedInUser]>("onFileMoved");
    readonly onFilePermissionsChanged = new SubscribableEvent<[Path, LoggedInUser]>("onPermissionsChanged");

    //'service.filesystem':NEEDS_AN_IMPLEMENTATION, //onFileChange( fileName, filePath, fileContents )

    constructor(init?: FileSystemInit) {
        this.root = new FileSystemFolder(
            Path.root(),
            "",
            {
                owner: "root",
                group: "root",
                readableBy: "everyone",
                writableBy: "owner",
                executableBy: "everyone"
            }
        );

        if (init) {
            this.initializeFromObject(init);
        }
    }

    private initializeFromObject(
        init: FileSystemInit, 
        basePath: Path = Path.root(), 
        defaultOwner: string = 'root', 
        defaultGroup: string = 'root'
    ): void {
        for (const [name, node] of Object.entries(init)) {
            const path = basePath.append(name);
            
            // Handle simple file (string/Uint8Array)
            if (typeof node === 'string' || node instanceof Uint8Array) {
                FSInit_createFileImpl_IgnorePermissions(this.resolve(path.parent) as FileSystemFolder, path.name, node, { 
                    id: defaultOwner, 
                    groups: [defaultGroup] 
                });
                continue;
            }
    
            // Handle file with metadata
            if ('content' in node && (typeof node.content === 'string' || node.content instanceof Uint8Array)) {
                const metadata = node as FileSystemInitMetadata;
                const creatorSession: LoggedInUser = {
                    id: metadata.owner || defaultOwner,
                    groups: [metadata.group || defaultGroup]
                };
                FSInit_createFileImpl_IgnorePermissions(this.resolve(path.parent) as FileSystemFolder, path.name, metadata.content, creatorSession);
                continue;
            }
    
            // At this point, node must be a directory
            const dirNode = node as { [key: string]: FileSystemInitNode } & { owner?: string, group?: string };
            const creatorSession: LoggedInUser = {
                id: dirNode.owner || defaultOwner,
                groups: [dirNode.group || defaultGroup]
            };
    
            FSInit_createFolderImpl_IgnorePermissions(this.resolve(path.parent) as FileSystemFolder, path.name, creatorSession);
            
            // Create new object without owner/group to pass to recursive call
            const contents: FileSystemInit = Object.fromEntries(
                Object.entries(dirNode).filter(([key]) => key !== 'owner' && key !== 'group')
            );
            
            this.initializeFromObject(
                contents,
                path, 
                dirNode.owner || defaultOwner, 
                dirNode.group || defaultGroup
            );
        }
    }

    resolve(path: Path): Node {
        if (!path.isAbsolute) {
            throw new Error('Path must be absolute');
        }

        if (path.equals(Path.root())) return this.root;

        let current: Node = this.root;
        if (!current)
            throw new Error('Root was missing/undefined');

        for (const segment of path.segments) {
            if (!(current as Folder).children) {
                throw new Error('Path component is not a folder');
            }

            let subFolderOfCurrent = (current as Folder)?.children?.get(segment);
            if (subFolderOfCurrent)
                current = subFolderOfCurrent;
            else
            {
                console.log(`resolve() failed on path: '${path}'`)
                throw new Error(`Path not found: ${path}`);
            }
        }
        return current;
    }

    asFileStattable(path: Path, session: LoggedInUser): File {
        const resolved = this.resolve(path);
        if (canExecImpl(resolved, session) && isFileImpl(resolved))
            return resolved as File;
        else
            return null;
    }
    asFileReadable(path: Path, session: LoggedInUser): File {
        const resolved = this.resolve(path);
        if (canReadImpl(resolved, session) && isFileImpl(resolved))
            return resolved as File;
        else
            return null;
    }

    asFolderStattable(path: Path, session: LoggedInUser): Folder {
        return this.asFolderExecutable(path, session);
    }
    asFolderReadable(path: Path, session: LoggedInUser): Folder {
        const resolved = this.resolve(path);
        if (canReadImpl(resolved, session) && isFolderImpl(resolved))
            return resolved as Folder;
        else
            return null;
    }
    asFolderExecutable(path: Path, session: LoggedInUser): Folder {
        const resolved = this.resolve(path);
        if (canExecImpl(resolved, session) && isFolderImpl(resolved))
            return resolved as Folder;
        else
            return null;
    }

    isRoot(path: Path): boolean {
        return (path.equals(Path.root()));
    }

    createFile(path: Path, content: string | Uint8Array, session: LoggedInUser): File {
        const file = createFileImpl(this.resolve(path.parent) as FileSystemFolder, path.name, content, session);
        this.onFileCreated.invoke(path, session);
        return file;
    }

    createFolder(path: Path, session: LoggedInUser): Folder {
        const folder = createFolderImpl(this.resolve(path.parent) as FileSystemFolder, path.name, session);
        this.onFileCreated.invoke(path, session);
        return folder;
    }

    readFile(path: Path, session: LoggedInUser): string | Uint8Array {
        const result = readFileImpl(this.resolve(path) as File, session);
        this.onFileModified.invoke(path.name, path.parent, result, session);  // ( fileName, folderPath, fileContents, LoggedInUser )
        return result;
    }

    writeFile(path: Path, content: string | Uint8Array, session: LoggedInUser): void {
        writeFileImpl(this.resolve(path) as FileSystemFile, content, session);
        this.onFileModified.invoke(path.name, path.parent, content, session);  // ( fileName, folderPath, fileContents, LoggedInUser )
    }

    appendFile(path: Path, content: string | Uint8Array, session: LoggedInUser): void {
        const newContents = appendFileImpl(this.resolve(path) as FileSystemFile, content, session);
        this.onFileModified.invoke(path.name, path.parent, newContents, session);  // ( fileName, folderPath, fileContents, LoggedInUser )
    }

    deleteFile(path: Path, session: LoggedInUser): void {
        deleteFileImpl(this.resolve(path.parent) as FileSystemFolder, path.name, session);
        this.onFileDeleted.invoke(path, session);
    }

    deleteFolder(path: Path, recursive: boolean, session: LoggedInUser): void {
        deleteFolderImpl(this.resolve(path.parent) as FileSystemFolder, path.name, recursive, session);
        this.onFileDeleted.invoke(path, session);
    }

    move(source: Path, destination: Path, session: LoggedInUser): void {
        moveImpl(this.resolve(source.parent) as FileSystemFolder, source.name, this.resolve(destination.parent) as FileSystemFolder, destination.name, session);
        this.onFileMoved.invoke(source, session);
        this.onFileMoved.invoke(destination, session);
    }

    copy(source: Path, destination: Path, session: LoggedInUser): void {
        copyImpl(this.resolve(source.parent) as FileSystemFolder, source.name, this.resolve(destination.parent) as FileSystemFolder, destination.name, session);
        this.onFileCreated.invoke(destination, session);
    }

    exists(path: Path, session: LoggedInUser): boolean {
        return existsImpl(this.resolve(path), session);
    }

    canStatAt(path: Path, session: LoggedInUser): boolean {
        try {
            return canExecImpl(this.resolve(path), session);
        }
        catch (e) {
            return false;
        }
    }
    canReadAt(path: Path, session: LoggedInUser): boolean {
        try {
            return canReadImpl(this.resolve(path), session);
        }
        catch (e) {
            return false;
        }
    }

    hasFileAt(path: Path): boolean {
        try {
            console.log(`checking path ${path} is file`)
            return isFileImpl(this.resolve(path));
        }
        catch (e) {
            return false;
        }
    }

    hasFolderAt(path: Path): boolean {
        try {
            return isFolderImpl(this.resolve(path));
        }
        catch (e) {
            return false;
        }
    }
    

    listFolder(path: Path, session: LoggedInUser): ReadonlyArray<Node> {
        return listFolderImpl(this.resolve(path) as Folder, session);
    }

    changePermissions(path: Path, permissions: FilePermissions, session: LoggedInUser): void {
        changePermissionsImpl(this.resolve(path), permissions, session);
        this.onFilePermissionsChanged.invoke(path, session);
    }

    changeOwner(path: Path, newOwner: string, session: LoggedInUser): void {
        changeOwnerImpl(this.resolve(path), newOwner, session);
        this.onFilePermissionsChanged.invoke(path, session);
    }

    changeGroup(path: Path, newGroup: string, session: LoggedInUser): void {
        changeGroupImpl(this.resolve(path), newGroup, session);
        this.onFilePermissionsChanged.invoke(path, session);
    }
}