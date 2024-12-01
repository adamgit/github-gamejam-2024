import { Path } from '../path/path';
import { FilePermissions } from './permissions';

/**
 * PUBLIC Node / File / Folder that is used by any other code/system accessing
 * our filesystem API.
 * 
 * Instead of a simple 'type' or interface, we use a base class so that we
 * can provide external code with a readonly interface to File.content and
 * Folder.children -- but the filesystem implementation has read/write
 * access to the same properties (via subclassing, and private subclasses
 * of File/Folder that expose those properties - but only to the filesystem itself)
 */
export abstract class Node {
    readonly path: Path;
    readonly name: string;
    readonly permissions: FilePermissions;

    protected constructor(
        path: Path,
        name: string,
        permissions: FilePermissions
    ) {
        this.path = path;
        this.name = name;
        this.permissions = permissions;
    }
}

export class File extends Node {
    readonly content: string | Uint8Array;

    protected constructor(
        path: Path,
        name: string,
        permissions: FilePermissions,
        content: string | Uint8Array
    ) {
        super(path, name, permissions);
        this.content = content;
    }

    protected setContent(content: string | Uint8Array) {
        (this as any).content = content;
    }
}

export class Folder extends Node {
    readonly children: ReadonlyMap<string, Node>;
    private _mutableChildren: Map<string, Node>;

    protected constructor(
        path: Path,
        name: string,
        permissions: FilePermissions
    ) {
        super(path, name, permissions);
        this._mutableChildren = new Map();
        this.children = this._mutableChildren;
    }

    protected addChild(name: string, node: Node) {
        this._mutableChildren.set(name, node);
    }

    protected removeChild(name: string) {
        this._mutableChildren.delete(name);
    }
}