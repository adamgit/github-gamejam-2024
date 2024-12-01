import React, { useEffect, useState } from 'react';
import { ApplicationSpec } from '../data/OperatingSystem';

interface InstallDialogProps {
    app: ApplicationSpec; // The app being installed
    progress: number;     // Initial progress value
    onComplete: () => void; // Callback triggered upon completion
}

const InstallDialog: React.FC<InstallDialogProps> = ({ app, progress, onComplete }) => {
    const [currentProgress, setCurrentProgress] = useState(progress);

    // Handle progress updates
    useEffect(() => {
        if (currentProgress >= 100) {
            console.log("[app-install] will notify complete for: "+app.name);
            onComplete(); // Notify completion
            return;
        }

        // Increment progress periodically
        const timer = setInterval(() => {
            setCurrentProgress((prev) => Math.min(prev + 10, 100)); // Increment progress
        }, 200); // Update every 200ms

        return () => clearInterval(timer); // Clean up timer on unmount
    }, [currentProgress, onComplete]);

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            zIndex: 1000,
        }}>
            <h3>Installing {app.name}</h3>
            <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: '#ccc',
                marginTop: '10px',
                borderRadius: '5px',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${currentProgress}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    transition: 'width 0.2s',
                }} />
            </div>
            <p style={{ marginTop: '10px', textAlign: 'center' }}>{currentProgress}%</p>
        </div>
    );
};

export default InstallDialog;
