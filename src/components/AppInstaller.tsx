import React, { useContext, useState } from 'react';
import { 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Button,
  Box,
  Divider
} from '@mui/material';
import { Download } from 'lucide-react';
import { useOS, useOSState } from '../hooks/useOperatingSystem';

export default function AppInstaller() {
  const os = useOS();
 const state = useOSState();
 
  const [installing, setInstalling] = useState<number | null>(null);

  const handleInstall = async (appId: number) => {
    setInstalling(appId);
    const app = state.availableApps.find(a => a.id === appId);
    if (app) {
      os.installApp(app);  // Use OS's public install method
    }
    setInstalling(null);
  };

  return (
    <Card className="w-full h-full bg-gray-100">
      <CardContent>
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" color="primary">
            Available Applications
          </Typography>
        </Box>
        
        <Divider className="mb-4" />

        <List>
          {state.availableApps.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No applications available"
                secondary="All apps are currently installed"
              />
            </ListItem>
          ) : (
            state.availableApps.map(app => (
              <ListItem 
                key={app.id}
                className="mb-2 bg-white rounded shadow-sm"
              >
                <ListItemIcon className="text-2xl">
                  {app.icon}
                </ListItemIcon>
                <ListItemText
                  primary={app.name}
                  secondary={app.singleInstance ? "Single Instance App" : "Multiple Instances Allowed"}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleInstall(app.id)}
                  disabled={installing === app.id}
                  startIcon={<Download size={16} />}
                >
                  {installing === app.id ? 'Installing...' : 'Install'}
                </Button>
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}