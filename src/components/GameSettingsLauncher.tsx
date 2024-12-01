import React, { useState, useContext, createContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

// Create a context for managing settings globally
type SettingsContextType = {
  muteAll: boolean;
  uiVolume: number;
  bgMusicVolume: number;
  setMuteAll: (value: boolean) => void;
  setUiVolume: (value: number) => void;
  setBgMusicVolume: (value: number) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [muteAll, setMuteAll] = useState(false);
  const [uiVolume, setUiVolume] = useState(1);
  const [bgMusicVolume, setBgMusicVolume] = useState(1);

  return (
    <SettingsContext.Provider
      value={{ muteAll, uiVolume, bgMusicVolume, setMuteAll, setUiVolume, setBgMusicVolume }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Main component
export default function GameSettingsLauncher() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  function displaySettings() {
    handleOpenDialog();
  }

  const settings = useContext(SettingsContext);

  if (!settings) {
    throw new Error('SettingsProvider is missing');
  }

  const { muteAll, setMuteAll, uiVolume, setUiVolume, bgMusicVolume, setBgMusicVolume } = settings;

  return (
    <>
      <IconButton
        onClick={displaySettings}
        aria-label="launch settings"
        style={{
          backgroundColor: '#007BFF', // Set your desired background color
          color: '#FFFFFF', // Set your desired icon color
          pointerEvents: 'auto', /* Re-enable clicks on icon groups */
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="game-settings-dialog"
        fullWidth
        maxWidth="sm"
        transitionDuration={{ enter: 500, exit: 300 }}
      >
        <DialogTitle id="game-settings-dialog">Game Settings</DialogTitle>
        <DialogContent>
          {/* Mute All Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={muteAll}
                onChange={(e) => setMuteAll(e.target.checked)}
                color="primary"
              />
            }
            label="Mute All"
          />

          {/* UI Volume Slider */}
          <div style={{ opacity: muteAll ? 0.5 : 1, pointerEvents: muteAll ? 'none' : 'auto' }}>
            <FormControlLabel
              control={
                <Slider
                  value={uiVolume}
                  onChange={(e, value) => setUiVolume(value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  aria-labelledby="ui-volume-slider"
                />
              }
              label="UI Volume"
              labelPlacement="top"
            />
          </div>

          {/* Background Music Volume Slider */}
          <div style={{ opacity: muteAll ? 0.5 : 1, pointerEvents: muteAll ? 'none' : 'auto' }}>
            <FormControlLabel
              control={
                <Slider
                  value={bgMusicVolume}
                  onChange={(e, value) => setBgMusicVolume(value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  aria-labelledby="bg-music-volume-slider"
                />
              }
              label="Background Music Volume"
              labelPlacement="top"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
