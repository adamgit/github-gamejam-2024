import React, { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import DesktopTheme from './DesktopTheme';
import './Window.css';
import { Typography } from '@mui/material';

import useSound from 'use-sound';
//import sfxSelectWindow from '../../public/assets/freesound/731993_12739651-lq.mp3'
import sfxSelectWindow from '../../public/assets/freesound/540269_11242864-lq.mp3'
//import sfxSelectWindow from '../../public/assets/freesound/370848_5450487-lq.mp3'

const Window = ({ spec, applicationId, windowId, onSelect, onClose, isFocused, onPositionChange, onSizeChange }) => {
  const { title, component: Component, x, y, zIndex, additionalProps } = spec;
  const [dimensions, setDimensions] = useState({ width: spec.width, height: spec.height });

  const [play, { stop }] = useSound(sfxSelectWindow, { volume: 1 });
  
  const handleResize = (e, direction, ref, delta, position) => {
    onSizeChange(windowId, ref.style.width, ref.style.height);
  };
  
  const handleDragStop = (e, d) => {
    onPositionChange(windowId, d.x, d.y);
  };
 
  const handleWindowClick = () => {
    //play();
    onSelect(); // Notify DesktopWindows that this window was selected
  };

  return (
    <Rnd
      default={{
        x: x,
        y: y,
        width: dimensions.width,
        height: dimensions.height, 
      }}
      minWidth={200}
      minHeight={100}
      bounds='window'
      dragHandleClassName='window-titlebar'
      onResize={handleResize}  // Resize handler
      onDragStart={handleWindowClick}   // Focus window on drag
      onDragStop={handleDragStop}
      onMouseDown={handleWindowClick}   // Focus window on click
      style={{
         zIndex: zIndex,        // Set the zIndex based on focus
         pointerEvents: 'auto', /* Allow windows to be clicked */
        }}
     >
      <div className="window">
        {/* Title bar */}
        <div className="window-titlebar" style={DesktopTheme.getTitleBarStyle(isFocused, Component)}>
          <Typography variant='body1'>{title} - ID: {windowId}</Typography>
          <button onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </div>

        {/* Window content */}
        <div className="window-content" style={{ width: '100%', height: 'calc(100% - 30px)' }}>
          <Component isFocused={isFocused} onClose={onClose} appId={applicationId} {...additionalProps} /> {/* Attach ref to the child component */}
        </div>
      </div>
    </Rnd>
  );
};

export default Window;
