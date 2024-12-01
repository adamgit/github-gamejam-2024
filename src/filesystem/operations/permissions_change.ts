import { Path } from '../path/path';
import { Folder, Node } from '../types/node';
import { FilePermissions } from '../types/permissions';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';

export function changePermissionsImpl(
    node: Node,
    permissions: FilePermissions,
    session: LoggedInUser
): void {
    if (!node) {
        throw new Error('Path not found');
    }
    
    if (session.id !== 'root' && session.id !== node.permissions.owner) {
        throw new Error('Permission denied');
    }
    
    (node as any).permissions = permissions;
}

export function changeOwnerImpl(
    node: Node,
    newOwner: string,
    session: LoggedInUser
): void {
    if (!node) {
        throw new Error('Path not found');
    }
    
    if (session.id !== 'root') {
        throw new Error('Permission denied');
    }
    
    (node as any).permissions = {
        ...node.permissions,
        owner: newOwner
    };
}

export function changeGroupImpl(
    node: Node,
    newGroup: string,
    session: LoggedInUser
): void {
    if (!node) {
        throw new Error('Path not found');
    }
    
    if (session.id !== 'root' && session.id !== node.permissions.owner) {
        throw new Error('Permission denied');
    }
    
    (node as any).permissions = {
        ...node.permissions,
        group: newGroup
    };
}