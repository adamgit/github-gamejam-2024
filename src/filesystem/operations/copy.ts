import { Path } from '../path/path';
import { File, Folder, Node } from '../types/node';
import { FileSystemFolder, FileSystemNode } from '../types/internalnodes';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';
import { createFileImpl, createFolderImpl } from './create';

export function copyImpl(
    sourceParent: FileSystemFolder,
    sourceName: string,
    destParent: FileSystemFolder,
    destName: string,
    session: LoggedInUser
 ): Node {
    const sourceNode = sourceParent.children[sourceName];

    if (!checkPermissions(sourceNode, session, 'read') || 
        !checkPermissions(destParent, session, 'write')) {
        throw new Error('Permission denied');
    }

    const newPath = destParent.path.append(destName);
    
    if (sourceNode instanceof File) {
        const newFile = createFileImpl( destParent, destName, sourceNode.content, session);
        destParent.setChild(destName, newFile);
        return newFile;
    }
    else
    {
        const newFolder = createFolderImpl( destParent, destName, session);
        
        const sourceFolder = sourceParent.children[sourceName];
        for (const [childName, child] of sourceFolder.children) {
            copyImpl( sourceFolder, childName, newFolder as FileSystemFolder, childName, session);
        }
        
        return newFolder;
    }
}