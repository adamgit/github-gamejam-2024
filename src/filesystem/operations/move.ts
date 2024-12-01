import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';

export function moveImpl(
    sourceParent: FileSystemFolder,
    sourceName: string,
    destParent: FileSystemFolder,
    destName: string,
    session: LoggedInUser
): void {
    if (!checkPermissions(sourceParent, session, 'write') || 
        !checkPermissions(destParent, session, 'write')) {
        throw new Error('Permission denied');
    }

    const node = sourceParent.children[sourceName];

    sourceParent.deleteChild(sourceName);
    node.updatePath(destParent.path.append(destName));
    destParent.setChild(destName, node);
}