import React, { forwardRef, useImperativeHandle } from 'react';
import useSound from 'use-sound';
import sfxNewMessage from '../../public/assets/freesound/701704_7862587-lq.mp3';

export const HackSoundPlayerNewMessage = forwardRef((_, ref) => {
  const [play] = useSound(sfxNewMessage, { volume: 1 });

  // Expose a playSound method to the parent
  useImperativeHandle(ref, () => ({
    playSound() {
      play();
    },
  }));

  return null; // No UI for this component
});