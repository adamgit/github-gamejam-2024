import { File, Folder, Node } from '../types/node';
import { FileSystemFile, FileSystemFolder, FileSystemNode } from '../types/internalnodes';
import { LoggedInUser } from '../../data/HostConnection';
import { Path } from '../path/path';
import { checkPermissions } from './permissions';

export function createFileImpl(
    parentFolder: FileSystemFolder,
    name: string,
    content: string | Uint8Array,
    session: LoggedInUser
): File
{
    if (!checkPermissions(parentFolder, session, 'write')) {
        throw new Error('Cannot create file: parent directory not writable');
    }
    
    const newFile = new FileSystemFile(
        parentFolder.path.append(name),
        name,
        {
            owner: session.id,
            group: session.groups[0] || session.id,
            readableBy: "everyone",
            writableBy: "owner",
            executableBy: "owner"
        },
        content
    );

    parentFolder.setChild( name, newFile);
    return newFile;
}

export function createFolderImpl(
    parentFolder: FileSystemFolder,
    name: string,
    session: LoggedInUser
): Folder {
    
    if (!parent || !checkPermissions(parentFolder, session, 'write')) {
        throw new Error('Cannot create folder: parent directory not writable');
    }

    const newFolder = new FileSystemFolder(
        parentFolder.path.append(name),
        name,
        {
            owner: session.id,
            group: session.groups[0] || session.id,
            readableBy: "everyone",
            writableBy: "owner",
            executableBy: "everyone"
        },
    );

    parentFolder.setChild(name, newFolder);
    return newFolder;
}

/**
 * ONLY used when creating a filesystem artificially - so we ignore all permissions
 * (ideally you should also be invoking this WITHOUT any 'onFileCreated' etc callbacks,
 * since you're doing it typically as a behind-the-scenes magic)
 * 
 * @param parentFolder 
 * @param name 
 * @param content 
 * @param session 
 * @returns 
 */
export function FSInit_createFileImpl_IgnorePermissions(
    parentFolder: FileSystemFolder,
    name: string,
    content: string | Uint8Array,
    session: LoggedInUser
): File
{    
    const newFile = new FileSystemFile(
        parentFolder.path.append(name),
        name,
        {
            owner: session.id,
            group: session.groups[0] || session.id,
            readableBy: "everyone",
            writableBy: "owner",
            executableBy: "owner"
        },
        content
    );

    parentFolder.setChild( name, newFile);
    return newFile;
}

/**
 * ONLY used when creating a filesystem artificially - so we ignore all permissions
 * (ideally you should also be invoking this WITHOUT any 'onFileCreated' etc callbacks,
 * since you're doing it typically as a behind-the-scenes magic)
 * 
 * @param parentFolder 
 * @param name 
 * @param session 
 * @returns 
 */
export function FSInit_createFolderImpl_IgnorePermissions(
    parentFolder: FileSystemFolder,
    name: string,
    session: LoggedInUser
): Folder
{
    
    const newFolder = new FileSystemFolder(
        parentFolder.path.append(name),
        name,
        {
            owner: session.id,
            group: session.groups[0] || session.id,
            readableBy: "everyone",
            writableBy: "owner",
            executableBy: "everyone"
        },
    );

    parentFolder.setChild(name, newFolder);
    return newFolder;
}