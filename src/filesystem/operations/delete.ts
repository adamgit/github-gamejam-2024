import { Path } from '../path/path';
import { Folder, Node } from '../types/node';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';

export function deleteFileImpl(
    parentFolder:FileSystemFolder,
    name: string,
    session: LoggedInUser
): void {
    const node = parentFolder.children.get(name);
    
    if (!node) {
        throw new Error('Not a file');
    }
    
    if (!checkPermissions(parentFolder, session, 'write')) {
        throw new Error('Permission denied');
    }
    
    parentFolder.deleteChild(name);
}

export function deleteFolderImpl(
    parentFolder:FileSystemFolder,
    name: string,
    recursive: boolean,
    session: LoggedInUser
): void {
    const folder = parentFolder.children.get(name) as Folder;

    if (!folder) {
        throw new Error('Not a folder');
    }
    
    if (!checkPermissions(folder, session, 'write')) {
        throw new Error('Permission denied');
    }
    
    if (!recursive && folder.children.size > 0) {
        throw new Error('Folder not empty');
    }
    
    parentFolder.deleteChild(name);
}