import React, { useEffect, useRef, useState, useMemo /* so we can force OperatingSystem to FULLY init before ALL other components */ } from 'react';
import DesktopBackground from './DesktopBackground';
import DesktopIcons from './DesktopIcons';
import DesktopWindows from './DesktopWindows';
import InstallDialog from './InstallDialog';
import DesktopGameControls from './DesktopControls';
import { ApplicationSpec, OperatingSystem } from '../data/OperatingSystem';

import Layer from './Layer';
import { setMissionOS } from '../missionsystem/OSForMissions';


import { OSContext } from './OSContext';
import { OSState } from '../data/OperatingSystemMutableState';

  interface DesktopWindowsRef {
    createNewWindow: (appSpec: any) => void;
    asyncSelectWindowByID: (windowId: number) => void;
  }

  
function Desktop() {
 const osInit = useRef<{attempted: boolean, error: Error|null}>();
 const [os, setOS] = useState<OperatingSystem|null>(null);


 if (!osInit.current?.attempted) {
  try {
    const newOS = new OperatingSystem();
    setMissionOS(newOS);
    
    setOS(newOS);
    osInit.current = {attempted: true, error: null};
  } catch (e) {
    console.error("**** REACT SILENTLY DELETES THIS IF YOU DON'T STOP IT ****, true error: "+e)
    osInit.current = {attempted: true, error: e as Error};
  }
}

if (osInit.current?.error) {
  return <div style={{padding: 20, color: 'red'}}>
    <h2>Critical Error During OS Init:</h2>
    <pre>{osInit.current.error.message}</pre>
    <pre>{osInit.current.error.stack}</pre>
  </div>;
}

    const [newlyInstalledApp, setNewlyInstalledApp] = useState<ApplicationSpec | null>(null);
   const [state, setState] = useState<OSState | null>(null); // Track OS state locally ... // so we can watch the installing-animating-process and update
   

    const desktopWindowsRef = useRef<DesktopWindowsRef>(null);

   useEffect(() => {
    os.registerWindowCreator((app: ApplicationSpec) => {
      if (desktopWindowsRef.current) {
        desktopWindowsRef.current.createNewWindow(app);
      }
    });
  }, [os]);

  useEffect(() => {
    if (os) {
        setState(os.getState());
        const unsubscribe = os.subscribe(() => {
            const newState = os.getState();
            //console.log("Updated OS State:", newState);
            setState(newState);
        });
        return () => unsubscribe();
    }
}, [os]);
   const handleAppIconClick = (appSpec) => {
        if( desktopWindowsRef.current )
            desktopWindowsRef.current.createNewWindow(appSpec);
    };

    const handleBackgroundClick = () => {
        console.log("background was clicked")
        if( desktopWindowsRef.current )
            desktopWindowsRef.current.asyncSelectWindowByID(0);
        else
        console.log(" ... but the windowref was NULL!")
    };
  
    return (
        <div className="desktop" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <OSContext.Provider value={os}>
                {/* Background layer */}
                <Layer zIndex={1}>
                    <DesktopBackground onClickBackground={handleBackgroundClick} />
                </Layer>

                {/* Icons layer */}
                <Layer zIndex={2}>
                    <DesktopIcons
                    onAppIconClick={handleAppIconClick}
                    newlyInstalledApp={newlyInstalledApp} />
                </Layer>

                {/* Windows layer */}
                <Layer zIndex={3}>
                    <DesktopWindows ref={desktopWindowsRef} />
                </Layer>

                {/* Modal Layer */}
                <Layer zIndex={4}>
                  <></>
                {state?.activeInstallations.map((install) => (
                    <InstallDialog
                        key={install.app.id}
                        app={install.app}
                        progress={install.progress}
                        onComplete={() => os.completeInstallation(install.app.id)}
                    />
                ))}

{/* Special UI / HUD / out-of-game Layer */}
<Layer zIndex={5}>
  <DesktopGameControls></DesktopGameControls>
</Layer>
            </Layer>
            </OSContext.Provider>
        </div>
    );
}

export default Desktop;
