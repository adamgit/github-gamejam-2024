import React, { useState } from 'react';
import Desktop from './components/Desktop';
import IntroScreen from './components/IntroScreen';
import './App.css';
import { ThemeProvider } from '@emotion/react';
import { SettingsProvider } from './components/GameSettingsLauncher';
import { createTheme, responsiveFontSizes } from '@mui/material';

let baseTheme = createTheme({
  /* NOTE: MUI's breakpoints are fundamentally broken with internal dependencies, and silently CRASH if not passsed-in as part of the firts arg when creating theme */
  breakpoints: {
    values: {
      xs: 0,
      sm: 400,
      md: 800,
      lg: 1200,
      xl: 1500,
    },
  },
  typography: {
    /** Completely useless, MUI requires us to do this using the 'breakpoints.up/down' funcs instead: h2: { fontSize: '1.5rem'} */
  }
});

const theme = createTheme({
  typography: {
    body1:
    {
      fontSize: '0.6rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '0.65rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '0.7rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '0.75rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '0.8rem' }
    },
    body2:
    {
      fontSize: '0.55rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '0.6rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '0.65rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '0.7rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '0.75rem' }
    },
    h1:
    {
      fontSize: '1.4rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '1.5rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '1.65rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '1.8rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '2.0rem' }
    },
    h2:
    {
      fontSize: '1.15rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '1.2rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '1.35rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '1.45rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '1.5rem' }
    },
    h3:
    {
      fontSize: '1.0em',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '1.1rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '1.2rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '1.3rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '1.4rem' }
    },
    h4:
    {
      fontSize: '0.9em',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '0.95rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '1.0rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '1.1rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '1.2rem' }
    },
    h5:
    {
      fontSize: '0.8rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '0.8rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '0.83rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '0.9rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '0.95rem' }
    },
    h6:
    {
      fontSize: '0.7rem',
      [baseTheme.breakpoints.up("sm")]: { fontSize: '0.7rem' },
      [baseTheme.breakpoints.up("md")]: { fontSize: '0.7rem' },
      [baseTheme.breakpoints.up("lg")]: { fontSize: '0.8rem' },
      [baseTheme.breakpoints.up("xl")]: { fontSize: '0.8rem' }
    },
  }
});



function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <SettingsProvider>
      <div className="App">
          <ThemeProvider theme={theme}>
              {showIntro ? (
          <IntroScreen onStartGame={() => setShowIntro(false)} />
        ) : (
          <Desktop />
        )}
          </ThemeProvider>
      </div>
      </SettingsProvider>
  );
}
export default App;