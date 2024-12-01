import React, { useContext } from 'react';
import ApplicationIcon from './ApplicationIcon';
import { useOS, useOSState } from '../hooks/useOperatingSystem';
import './desktop-icons.css'

const DesktopIcons = ({ onAppIconClick, newlyInstalledApp /** lets us animate when a new app is installed */ }) => {
  const os = useOS();
  const state = useOSState();

  console.log("DesktopIcons remounted ... ")
  return (
    <div className='desktop-icons-container'>
      <div className="desktop-icons desktop-icons-apps">
        {state.installedApps.map(app => (
          <ApplicationIcon
            key={app.id}
            appSpec={app}
            onClick={() => onAppIconClick(app)}
            unreadMessages={app.unreadMessages || 0}
            className={newlyInstalledApp?.id === app.id ? 'newly-installed' : ''}
          />
        ))}
      </div>

      <div className="desktop-icons desktop-icons-debug">
        {state.debugTools.map(tool => (
          <ApplicationIcon
            key={tool.id}
            appSpec={tool}
            onClick={() => onAppIconClick(tool)}
            unreadMessages={tool.unreadMessages || 0}
            className={`debug-tool-icon ${newlyInstalledApp?.id === tool.id ? 'newly-installed' : ''}`}
          />
        ))}
      </div>
      </div>
  );
};

export default DesktopIcons;
