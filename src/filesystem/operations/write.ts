import { Path } from '../path/path';
import { FileSystemFile } from '../types/internalnodes';
import { LoggedInUser } from '../../data/HostConnection';
import { checkPermissions } from './permissions';

export function writeFileImpl(
    file: FileSystemFile,
    content: string | Uint8Array,
    session: LoggedInUser
): void {
    if (!checkPermissions(file, session, 'write')) {
        throw new Error('Permission denied');
    }
    
    file.updateContent(content);
}

export function appendFileImpl(
    file: FileSystemFile,
    content: string | Uint8Array,
    session: LoggedInUser
): string | Uint8Array {
    if (!checkPermissions(file, session, 'write')) {
        throw new Error('Permission denied');
    }

    if (typeof file.content === 'string' && typeof content === 'string')
    {
        file.updateContent(file.content + content);
        return file.content + content;
    }
    else if (file.content instanceof Uint8Array && content instanceof Uint8Array)
    {
        const newArray = new Uint8Array(file.content.length + content.length);
        newArray.set(file.content);
        newArray.set(content, file.content.length);
        file.updateContent(newArray);
        return newArray;
    }
    else
    {
        throw new Error('Content type mismatch');
    }
}