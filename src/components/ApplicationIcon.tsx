import { Badge, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useOS } from '../hooks/useOperatingSystem';

const ApplicationIcon = ({ appSpec, onClick, unreadMessages, className = '' }) => {
  const os = useOS();
  const [unreadCount, setUnreadCount] = useState(0);
  const [appId] = useState(appSpec.id);

  useEffect(() => {
    const updateUnreadCount = () => {
      const app = os.getState().installedApps.find(app => app.id === appId);
      const newCount = app?.unreadMessages || 0;
      setUnreadCount((currentCount) => (currentCount !== newCount ? newCount : currentCount));
    };

    // Initial fetch
    updateUnreadCount();

    // Subscribe to OS changes
    const unsubscribe = os.subscribe(updateUnreadCount);
    return () => unsubscribe();
  }, [os, appId]);

  return (
    <div
      className={`application-icon ${className}`}
      onClick={() => { console.log("APPLICATION_ICON: running: " + appSpec.name); onClick(); }}
      style={{ pointerEvents: 'auto' }}
    >
      <Badge 
        color="error" 
        badgeContent={unreadMessages} 
        invisible={unreadMessages === 0} // Hide badge if no unread messages
      >
        {appSpec.iconFilename && <img src={appSpec.icon} alt={appSpec.name} />}
        {!appSpec.iconFilename && appSpec.icon && <div className="icon" style={{ color: appSpec.iconColor || 'white' }}>
            {appSpec.icon}
          </div>}
      </Badge>
      <Typography
        variant="body1"
        style={{
          color: 'white', 
          textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)', 
          marginTop: '8px',
        }}
      >
        {appSpec.name}
      </Typography>
    </div>
  );
};

export default ApplicationIcon;
