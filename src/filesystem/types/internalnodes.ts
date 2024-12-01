import { Path } from '../path/path';
import { FilePermissions } from './permissions';
import { Node, File, Folder } from './node';

/**
 * PRIVATE Node/File/Folder subclasses that expose read/write (instead of
 * readonly) access to the Filesystem *ONLY* for the filesystem API's internal
 * implementation classes/functions to use.
 * 
 * Instead of a simple 'type' or interface, we use a base class so that we
 * can provide external code with a readonly interface to File.content and
 * Folder.children -- but the filesystem implementation has read/write
 * access to the same properties (via subclassing, and private subclasses
 * of File/Folder that expose those properties - but only to the filesystem itself)
 */
export class FileSystemNode extends Node {
    protected constructor(
        path: Path,
        name: string,
        permissions: FilePermissions
    ) {
        super(path, name, permissions);
    }

    public updatePath(newPath: Path) {
        (this as any).path = newPath;
        (this as any).name = newPath.name;
    }

    public updatePermissions(newPermissions: FilePermissions) {
        (this as any).permissions = newPermissions;
    }
}

export class FileSystemFile extends File {
    constructor(
        path: Path,
        name: string,
        permissions: FilePermissions,
        content: string | Uint8Array
    ) {
        super(path, name, permissions, content);
    }

    updateContent(content: string | Uint8Array) {
        this.setContent(content);
    }
}

export class FileSystemFolder extends Folder {
    constructor(
        path: Path,
        name: string,
        permissions: FilePermissions
    ) {
        super(path, name, permissions);
    }

    setChild(name: string, node: Node) {
        this.addChild(name, node);
    }

    deleteChild(name: string) {
        this.removeChild(name);
    }
}