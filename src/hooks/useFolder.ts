import { useState, useEffect } from 'react';
import { useOS } from './useOperatingSystem';
import { VirtualFile } from '../data/OperatingSystem';

export function useFolder(path: string) {
  const os = useOS();
  const [files, setFiles] = useState<VirtualFile[]>([]);

  useEffect(() => {
    // Initial load
    const folder = os.fileSystem.getFolder(path);
    if (folder) {
      setFiles(folder.getAllFiles());
    }

    // Subscribe to changes
    const unsubscribe = os.fileSystem.subscribe(() => {
      const updatedFolder = os.fileSystem.getFolder(path);
      if (updatedFolder) {
        setFiles(updatedFolder.getAllFiles());
      }
    });

    return unsubscribe;
  }, [path]);

  return files;
}