import { Node } from '../types/node';
import { LoggedInUser } from '../../data/HostConnection';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';

export function checkPermissions(
    node: Node, 
    session: LoggedInUser, 
    type: 'read' | 'write' | 'execute'
): boolean {
    const scope = type === 'read' ? node.permissions.readableBy :
                 type === 'write' ? node.permissions.writableBy :
                 node.permissions.executableBy;
                 
    if (scope === 'everyone') return true;
    if (scope === 'owner' && (node.permissions.owner === session.id || session.id === 'root')) return true;
    if (scope === 'group' && session.groups.includes(node.permissions.group)) return true;
    if (scope instanceof Set && scope.has(session.id)) return true;
    
    return false;
}