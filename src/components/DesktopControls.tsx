import React, { useContext } from 'react';
import ApplicationIcon from './ApplicationIcon';
import { Box } from '@mui/material';
import BackgroundMusic from './BackgroundMusic';
import GameSettingsLauncher from './GameSettingsLauncher'

const DesktopGameControls = () => {
  return (
    <Box
    sx={{
      width: "100vw",
      height: "100vh",
      position: "relative",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        margin: "16px", // Add margin if needed
      }}
    >
<BackgroundMusic></BackgroundMusic>
<GameSettingsLauncher></GameSettingsLauncher> 
    </Box>
  </Box>
  );
};
export default DesktopGameControls;
