import { Path } from '../path/path';
import { Node, File, Folder } from '../types/node';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';

export function existsImpl(
    node: Node,
    session: LoggedInUser
): boolean {
    return node !== undefined && checkPermissions(node, session, 'execute');
}

export function canExecImpl(
    node: Node,
    session: LoggedInUser
): boolean {
    return node !== undefined
    && checkPermissions(node, session, 'execute');
}

export function canReadImpl(
    node: Node,
    session: LoggedInUser
): boolean {
    //console.log(`${JSON.stringify(node)} checkPermissions: ${checkPermissions(node, session, 'execute')}`);
    return node !== undefined
    && checkPermissions(node, session, 'read');
}

/**
 * NOTE: ignores permissions - used by meta code that needs to 'file vs folder'
 * @param node 
 * @returns 
 */
export function isFileImpl(
    node: Node,
): boolean {
    //console.log(`isFileImpl: checking file ${JSON.stringify(node)} / ${node.path} / ${node.name}  is NOT undefined (node !== undefined = ${node !== undefined} ), and that (node as File) has .content: ${(node as File)}.content = ${(node as File)?.content}`)
    return node !== undefined
           && (node as File)?.content !== undefined;
}

/**
 * NOTE: ignores permissions - used by meta code that needs to 'file vs folder'
 * @param node 
 * @returns 
 */
export function isFolderImpl(
    node: Node,
): boolean {
    //console.log(`${JSON.stringify(node)} checkPermissions: ${checkPermissions(node, session, 'execute')}`);
    return node !== undefined
    && !(!(node as Folder).children);
}

export function listFolderImpl(
    folder: Folder,
    session: LoggedInUser
): ReadonlyArray<Node> {
    
    if (!checkPermissions(folder, session, 'read')) {
        throw new Error('Permission denied');
    }
    
    return Array.from(folder.children.values());
}