import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import { GameServices } from './gameServices';

 // Now initialize game services, but with intro-screen the OS may not be setup yet, so ... wait!
GameServices.init();

// Finally: allow React to startup (to workaround core React bug that Exceptions on startup are SILENTLY ignored and everything instantiated TWICE!)
createRoot( document.querySelector("#root") ).render( <App/> );