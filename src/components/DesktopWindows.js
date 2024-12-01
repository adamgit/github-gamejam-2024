import React, { useState, forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
import Window from './Window';
import { loadWindowData, saveWindowData } from '../data/windowStateCache';

import useSound from 'use-sound';
//import sfxSelectWindow from '../../public/assets/freesound/488381_10523948-lq.mp3' // longer
//import sfxSelectWindow from '../../public/assets/freesound/683048_13200806-lq.mp3' // shorter
import sfxOpenWindow from '../../public/assets/freesound/540269_11242864-lq.mp3'
//import sfxSelectWindow from '../../public/assets/freesound/731993_12739651-lq.mp3'
import sfxSelectWindow from '../../public/assets/freesound/540269_11242864-lq.mp3'
import sfxCloseWindow from '../../public/assets/freesound/370848_5450487-lq.mp3'
//import sfxCloseWindow from '../../public/assets/pixabay/casual-click-pop-ui-5-262124.mp3'


const DesktopWindows = forwardRef((props, ref) => {
  const [windows, setWindows] = useState([]);
  const [selectedWindowId, setSelectedWindowId] = useState(0);
  const [futureSelectedWindowId, setFutureSelectedWindowId] = useState(0);

  const [playOpen, { stop: stopOpen }] = useSound(sfxOpenWindow, { volume: 1 });
  const [playSelect, { stop: stopSelect }] = useSound(sfxSelectWindow, { volume: 1 });
  const [playClose, { stop: stopClose }] = useSound(sfxCloseWindow, { volume: 1 });

  /** Monotonically increases; when you delete windows, new ones will NOT fill the gaps in window-id - window-IDs are permanent and unique! */
  const nextWindowId = useRef(1);

  /** DEBUG:
  useEffect(() => {
    console.log('     Current windows:', JSON.stringify(windows));
  }, [windows]);
  */

  // detect something changes the 'to-select' windowID, and process it ASYNCHRONOULSY (so that we can do a 'select window' alongside other async updates -- e.g. 'creating new window')
  useEffect(() =>
  {
    //console.log(`Something changed the selectedWindowId from ${selectedWindowId} to ${futureSelectedWindowId}`);
    windowSelected(selectedWindowId, futureSelectedWindowId);
    setSelectedWindowId( futureSelectedWindowId );
  }, [futureSelectedWindowId] );

  const asyncSelectWindowByID = useCallback( (windowId) =>
  {
    setFutureSelectedWindowId( windowId );
  });

  /**
   * Javascript has poor function-declaration handling: declaring two functions inside
   * an object only the 2nd can see the 1st. We need a way to save a reference to this
   * func so that it can be placed in the useImperativeHandle object, but can also
   * be invoked by other functions in that object (javascript core makes that impossible,
   * unless we cache the func-ref first - which is what we use useCallback for)
   * 
   * Additionally: because this is often invoked when React hasn't processed its fundamentally-asynch
   * data-writebacks yet (e.g. when creating a new window, React will refuse to update the value
   * of [windows] synchronously - so you're new window won't 'exist' in that array yet), we
   * act on a supplied-array of windows, rather than directly reading the component's own
   * useState array of windows.
   */
  const windowSelected = useCallback((previousSelectedId, newSelectedId) => {
    //console.log(`windowSelected(${newSelectedId})`)
    const newSelection = windows.find(w => w.id === newSelectedId);
    
    /** Accumulate changes to the incoming windows array into a new clone (so we can make MULTIPLE overlapping changes safely) */
    var futureWindowsArray = [...windows];

    if( newSelectedId != previousSelectedId )
    {
      //console.log("windowSelected() change has happened:    previousWindowID = "+JSON.stringify(previousSelectedId)+", selectedWindow = "+JSON.stringify(newSelection))
    // If there was a previously selected window, mark it as not focused
    if( previousSelectedId != 0 ) {
      futureWindowsArray =
        futureWindowsArray.map(w =>
          w.id === previousSelectedId ? { ...w, isFocused: false, zIndex: 1 } : w
      );
    }

    if( newSelection )
    {
      //console.log("Updating windows, will set the selected window (with ID = "+newSelectedId+") as the only one with isFocused = true, and bringing it to the front");
    // Set the new window as focused
    futureWindowsArray =
      futureWindowsArray.map(w =>
        w.id === newSelectedId ? { ...w, isFocused: true, zIndex: 10 } : w
    );
  }

  /** Finally: apply all our collapsed / merged changes back into the main [windows] state */
  //console.log("Will replaced [windows] with new array, contents: ... ")
  // DEBUG: futureWindowsArray.map( (w,i) => { console.log(` .. window-${i}th : ${JSON.stringify(w)}`)});
  setWindows(futureWindowsArray);

    // DO NOT update the selectedWindow id - this whole method is a side-effect of it changing!
    //selectedWindowId.current = newSelection.id;
    //console.log("selectedWindowRef is now: "+selectedWindowIdRef.current)
}
else
{
//console.log("selected the window that was already selected - ignoring")
}
  }, [windows]);

  const createNewWindow = useCallback(async (appSpec) => {
    // Check if the app is marked as singleInstance
    if (appSpec.singleInstance) {
      const existingWindow = windows.find(w => w.applicationId === appSpec.id);
      
      if (existingWindow) {
        // If there's an existing window, select it instead of creating a new one
        //console.log(`Selecting existing window for applicationId: ${appSpec.id}`);
        asyncSelectWindowByID(existingWindow.id);
        return; // Exit early to prevent creating a new window
      }
    }
    
    const newWindowId = nextWindowId.current;
    nextWindowId.current++;

    let defaultWidth = appSpec.additionalProps?.initialSize?.w ?? 400;
    let defaultHeight = appSpec.additionalProps?.initialSize?.h ?? 300;

    let newPosition = getNewWindowPosition(windows);
    

    // Load previously saved window data, if available
    
  if( windows.filter( w => w.applicationId === appSpec.id ).length < 1)
  {
    const savedData = await loadWindowData(appSpec.id);
  
  if (savedData) {
    //console.log("loaded saved data for window key: "+appSpec.id+" = "+JSON.stringify(savedData));
    defaultWidth = savedData.width;
    defaultHeight = savedData.height;
    newPosition = adjustPositionToScreen(
      savedData.x,
      savedData.y,
      savedData.width,
      savedData.height
    );
  }
  else
  console.log("no saved data for window key: "+appSpec.id);
  }

    // Create a new window specification
    //console.log("INFO: creating new window with windowID = "+newWindowId+"; there were "+windows?.length+" windows already")
    const newWindow = {
      id: newWindowId,
      title: appSpec.name,
      component: appSpec.component,
      applicationId: appSpec.id,
      width: defaultWidth,
      height: defaultHeight,
      isFocused: false, // Initially, the window is not focused
      x: newPosition.x,
      y: newPosition.y,
      additionalProps: appSpec.additionalProps || {}, // Injected additional parameters
    };

    //console.log("Creating new window with details: "+JSON.stringify(newWindow))

    // Add the new window to the windows array
    // Use the functional form of setWindows to ensure you're working with the latest state - instead of the 1-liner: "setWindows((prevWindows) => [...prevWindows, newWindow]);"
  /*setWindows((prevWindows) => {
    const updatedWindows = [...prevWindows, newWindow]; // Add new window to the state
    console.log("will call windowSelected() with new windowID ("+newWindow.id+") and new windows array, length = "+updatedWindows.length)
    windowSelected(newWindow.id, updatedWindows); // Call windowSelected with the updated array
    console.log( "...createNewWindow: completed seleting window");
    return updatedWindows; // Return the new state for windows
  });*/

  
  playOpen();

  setWindows( (prevWindows) => [...prevWindows, newWindow]);
  asyncSelectWindowByID( newWindowId );

  });

  // Expose a method to create a new window from outside this component (using ref)
  useImperativeHandle(ref, () => ({
    createNewWindow,
    asyncSelectWindowByID,
    
  }));

  // Method to update the position of a window
  const updateWindowPosition = (id, x, y) => {
    setWindows((prevWindows) =>
      prevWindows.map((window) =>
        window.id === id ? { ...window, x, y } : window
      )
    );
  };

  const updateWindowSize = (id, w, h) => {
    setWindows((prevWindows) =>
      prevWindows.map((window) =>
        window.id === id ? { ...window, width:w, height:h } : window
      )
    );
  };

  // Determine the position of the new window when windows are created
function getNewWindowPosition(windows) {
    if (windows.length === 0) {
      // Default to center if no other windows are present
      return { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 };
    }
  
    // Find the window with the highest z-index
    const topMostWindow = windows.reduce((topMost, currentWindow) => {
      return currentWindow.zIndex > topMost.zIndex ? currentWindow : topMost;
    }, windows[0]);
  
    // Add 20x20 pixels to the position of the top-most window
    //console.log("topmost window = "+JSON.stringify(topMostWindow))
    const newX = topMostWindow.x + 20;
    const newY = topMostWindow.y + 20;
  
    return { x: newX, y: newY };
  }

  

  // Method to close a window by removing it from the windows array
  const closeWindow = async (id) => {
    const windowToClose = windows.find(window => window.id === id);
    if (windowToClose) {

      // If this is the last of its kind... save it
      if( windows.filter( w => w.applicationId === windowToClose.applicationId ).length < 2)
        {
        
      // Save window size and position to indexedDB
      await saveWindowData(windowToClose.applicationId, {
        width: windowToClose.width,
        height: windowToClose.height,
        x: windowToClose.x,
        y: windowToClose.y
      });
    }
    }
    setWindows(windows.filter((window) => window.id !== id));
    if (selectedWindowId === id) {
      setSelectedWindowId(0);
    }

    playClose();
  };

  // Helper function to ensure the window is at least partially visible
function adjustPositionToScreen(x, y, width, height) {
  const minVerticalVisible = 200; // Minimum visible height in pixels
  const minHorizontalVisible = 100;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Adjust x position if it's off-screen horizontally
  if (x + width < minHorizontalVisible) {
    x = Math.max(minHorizontalVisible - width, 0); // Ensure at least part of it is visible
  } else if (x > screenWidth - minHorizontalVisible) {
    x = Math.min(screenWidth - minHorizontalVisible, x);
  }
  else if (x + width > screenWidth - minHorizontalVisible) {
     x = Math.min(screenWidth - minHorizontalVisible - width, x);
  }

  // Adjust y position if it's off-screen vertically
  if (y + height < minVerticalVisible) {
    y = Math.max(minVerticalVisible - height, 0);
  } else if (y > screenHeight - minVerticalVisible) {
    y = Math.min(screenHeight - minVerticalVisible, y);
  }

  return { x, y };
}

  return (
    <div className="desktop-windows">
      {windows.map((windowSpec) => (
        <Window
          key={windowSpec.id}
          spec={windowSpec}
          applicationId={windowSpec.applicationId}
          windowId={windowSpec.id}
          isFocused={windowSpec.isFocused}
          onSelect={() => asyncSelectWindowByID(windowSpec.id)}
          onClose={() => closeWindow(windowSpec.id)}
          onPositionChange={updateWindowPosition} // Pass down the position update handler
          onSizeChange={updateWindowSize}
        />
      ))}
    </div>
  );
});

export default DesktopWindows;
