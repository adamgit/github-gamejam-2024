import { Path } from '../path/path';
import { File, Folder, Node } from '../types/node';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';

export function readFileImpl(
    node: File,
    session: LoggedInUser
): string | Uint8Array {
    
    if (!checkPermissions(node, session, 'read')) {
        throw new Error('Permission denied');
    }
    
    return node.content;
}