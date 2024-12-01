import React, { useState } from 'react';
import { ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { GameServices } from '../gameServices';
import './IntroScreen.css';

const IntroScreen = ({ onStartGame }) => {
    const [showWarning, setShowWarning] = useState(true);
  
    const handleStartGame = () => {
      GameServices.init().startAutoScheduling();
      onStartGame();
    };
  
    const Warning = () => (
      <div className="intro-warning">
        <div className="intro-warning-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <AlertTriangle size={32} color="#ef4444" style={{ animation: 'pulse 2s infinite' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>Important Notice</h2>
          </div>
          
          <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>
            This is a game about hacking. Everything within this window is completely simulated - 
            you are never interacting with real servers or people. As long as you remain within 
            this browser window, you are in a safe, controlled environment.
          </p>
  
          <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>
            While you'll learn about historical hacking techniques from the 1990s/2000s, 
            these methods are obsolete and won't work on modern systems. This game is purely 
            for entertainment and education about computer security history.
          </p>

          <p style={{ marginBottom: '1rem', lineHeight: '1.5', color:'#aaaaff' }}>
            NOTE: keep checking your Whassup - the 'unread counter' is a bit broken doesnt always
            warn you there's new messages :(
          </p>
  
          <button 
            className="intro-button warning-button"
            onClick={() => handleStartGame()}
          >
            I Understand
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  
    return (
      <>
        {showWarning && <Warning />}
      </>
    );
  };
  
  export default IntroScreen;