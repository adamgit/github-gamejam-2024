import { VirtualFile, VirtualFolder } from './OperatingSystem';

import { FileSystemMutableState } from './FileSystemState';

export class FileSystem {
  private mutableState: FileSystemMutableState;
  private readonly backingFilesRoot = 'assets/virtual-local-hdd/';

  constructor() {
    this.mutableState = new FileSystemMutableState();
    
    // Initialize with default folders
    //this.createFolder('/home/user');
    //this.createFolder('/home/user/documents');
    this.createFolder('/desktop/documents');
  }

  public getState() {
    return this.mutableState.getState();
  }

  public subscribe(callback: () => void): () => void {
    return this.mutableState.subscribe(callback);
  }

  public createFolder(path: string): VirtualFolder {
    const folder = new VirtualFolder();
    this.mutableState.updateFolder(path, folder);
    return folder;
  }

  public getFolder(path: string): VirtualFolder | undefined {
    return this.getState().folders[path];
  }

  public resolveBackingFile(filename: string): string {
    return `${this.backingFilesRoot}${filename}`;
  }

  public addFileToFolder(path: string, file: Omit<VirtualFile, 'backingFile'>, backingFilename: string): boolean {
    const currentState = this.getState();
    const folder = currentState.folders[path];
    
    if (!folder)
    {
        throw "Cannot add file to virtual-folder, it hasn't been created yet: "+path;
        return false;
    }

    const newFolder = new VirtualFolder();
    // Copy existing files
    folder.getAllFiles().forEach(f => newFolder.addFile(f));
    
    // Add new file
    newFolder.addFile({
      ...file,
      backingFile: this.resolveBackingFile(backingFilename)
    });

    this.mutableState.updateFolder(path, newFolder);
    return true;
  }

  public removeFileFromFolder(path: string, filename: string): boolean {
    const currentState = this.getState();
    const folder = currentState.folders[path];
    
    if (!folder) return false;

    const newFolder = new VirtualFolder();
    // Copy all files except the one to remove
    folder.getAllFiles()
      .filter(f => f.filename !== filename)
      .forEach(f => newFolder.addFile(f));

    this.mutableState.updateFolder(path, newFolder);
    return true;
  }
}