import { useContext, useEffect, useState } from 'react';
import { OperatingSystem } from '../data/OperatingSystem';
import { OSContext } from '../components/OSContext';

export function useOS() {
    const os = useContext(OSContext);
  if (!os) {
    throw new Error('useOS must be used within OSContext.Provider');
  }
  return os;
  }
  
  export function useOSState() {
    const os = useOS();
    const [state, setState] = useState(os.getState());
    
    useEffect(() => {
      return os.subscribe(() => setState(os.getState()));
    }, [os]);
  
    return state;
  }