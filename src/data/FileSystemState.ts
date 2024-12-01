import { VirtualFile, VirtualFolder } from './OperatingSystem';

export interface FileSystemState {
    folders: Record<string, VirtualFolder>;
  }
  
  export class FileSystemMutableState {
    private state: FileSystemState = {
      folders: {}
    };
  
    private subscribers = new Set<() => void>();
  
    getState(): FileSystemState {
      // Return immutable copy
      return {
        folders: { ...this.state.folders }
      };
    }
  
    subscribe(callback: () => void): () => void {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
  
    private notifySubscribers(): void {
      this.subscribers.forEach(callback => callback());
    }
  
    updateFolder(path: string, folder: VirtualFolder): void {
      this.state.folders = {
        ...this.state.folders,
        [path]: folder
      };
      this.notifySubscribers();
    }
  
    removeFolder(path: string): void {
      const newFolders = { ...this.state.folders };
      delete newFolders[path];
      this.state.folders = newFolders;
      this.notifySubscribers();
    }
  }