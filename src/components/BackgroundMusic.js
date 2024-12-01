
import { useState, useEffect } from 'react';
import useSound from 'use-sound';
//import sfxBackgroundTrack1 from '../../public/assets/freesound/397472_3106992-lq.mp3';
import sfxBackgroundTrack1 from '../../public/assets/sounddraw/final_35c9ca00-94d4-4889-872a-0494dee5c888.mp3';
import sfxBackgroundTrack2 from '../../public/assets/sounddraw/final_f4a466c7-3d59-4c63-acb4-73998c693b8c.mp3';
import sfxBackgroundTrack3 from '../../public/assets/sounddraw/final_709884b5-f7bf-4ba5-be0e-3510e214016c.mp3';
import sfxBackgroundTrack4 from '../../public/assets/sounddraw/final_2ce233a2-c842-425e-b1b1-cbb0080aa560.mp3';

import { IconButton } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MusicOffIcon from '@mui/icons-material/MusicOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';

/** Access the global audio settings */
import { useContext } from 'react';
import { SettingsContext } from './GameSettingsLauncher'; // Adjust path as necessary

export default function BackgroundMusic() {
    const { muteAll, bgMusicVolume } = useContext(SettingsContext); // Access the muteAll state from context
    // Initialize BGM state
    //LEGACY: ONLY ONE TRACK EVER: const [playBGM, { sound, stop }] = useSound(sfxBackgroundTrack1, { loop: true });
    const [isPlaying, setIsPlaying] = useState(false);

    const tracks = [sfxBackgroundTrack1, sfxBackgroundTrack2, sfxBackgroundTrack3, sfxBackgroundTrack4];
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [playBGM, { sound, stop }] = useSound(tracks[currentTrackIndex], { onend: handleTrackEnd });

    const fadeOutNextTrack = 2 * 1000;

    const handleTrackEnd = () => {
        const nextTrackIndex = (currentTrackIndex + 1) % tracks.length; // Loop back to first track
        setCurrentTrackIndex(nextTrackIndex);
    };

    // Start music on mount
    useEffect(() => {
        //playBGM();
        //setIsPlaying(true);

        if (muteAll) {
            if (isPlaying) {
                sound?.stop(); // Stop sound if muteAll is enabled
                setIsPlaying(false);
            }
            return;
        }

        const timer = setTimeout(() => {
            console.log("Starting BGM with fadeeeeeeee....")
            playBGM({ volume: bgMusicVolume });
            if (sound) {
                sound.fade(0, bgMusicVolume, 6 * 1000); // Fade in from volume 0 to 1 over 1 second
            }
            setIsPlaying(true);
        }, 200); // Delay of 2 seconds before starting

        // Cleanup on unmount
        return () => {
            stop();
            clearTimeout(timer); // Cleanup the timer on unmount
        };
    }, [playBGM, stop, muteAll]);

    useEffect(() => {
        if (isPlaying && sound) {
            stop(); // Stop the previous sound
            playBGM({ volume: bgMusicVolume }); // Play the new track
            if (sound) {
                sound.fade(0, bgMusicVolume, 4 * 1000); // Fade in from volume 0 to 1 over 1 second
            }
        }
    }, [currentTrackIndex]); // Play new track whenever currentTrackIndex changes

    useEffect(() => {
        if (isPlaying) {
            if (sound) {
                sound.volume(bgMusicVolume);
            }
        }
    }, [bgMusicVolume])


    // Toggle play/pause
    const toggleMusic = () => {
        if (muteAll) return; // Prevent toggling if muteAll is enabled

        if (isPlaying) {
            sound?.stop();
        } else {
            playBGM({ volume: bgMusicVolume });
        }
        setIsPlaying(!isPlaying);
    };

    const handleNextTrack = () => {
        if (sound) {
            sound.fade(bgMusicVolume, 0, fadeOutNextTrack); // Fade out the current track
            setTimeout(() => {
                const nextTrackIndex = (currentTrackIndex + 1) % tracks.length; // Move to the next track
                setCurrentTrackIndex(nextTrackIndex);
            }, fadeOutNextTrack); // Wait for fade-out duration before changing the track
        }
        else
        {
        const nextTrackIndex = (currentTrackIndex + 1) % tracks.length; // Move to the next track
            setCurrentTrackIndex(nextTrackIndex);
        }
        
    };

    return (
        <>
            <IconButton
                onClick={toggleMusic}
                aria-label="toggle background music"
                style={{
                    //position: 'absolute',
                    //top: '16px',
                    //right: '16px',
                    //width: '64px',
                    //height: '64px',
                    backgroundColor: '#007BFF', // Set your desired background color
                    color: '#FFFFFF', // Set your desired icon color
                    pointerEvents: 'auto', /* Re-enable clicks on icon groups */
                }}
            >
                {isPlaying ? <MusicNoteIcon /> : <MusicOffIcon />}
            </IconButton>
            <IconButton
                onClick={handleNextTrack}
                aria-label="next track"
                style={{
                    backgroundColor: '#007BFF',
                    color: '#FFFFFF',
                    pointerEvents: 'auto',
                }}
            >
                <SkipNextIcon />
            </IconButton>
        </>
    );
}
