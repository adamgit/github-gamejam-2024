// components/ServerStatusCell.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { ScannedServerInfo } from './NetworkMonitorTypes';
import { ScannedServerStatusIndicator } from './ScannedServerStatusIndicator'; // Extract this too.

export const ServerStatusCell: React.FC<{ server: ScannedServerInfo }> = ({ server }) => (
  <Box>
    <Box display="flex" alignItems="center">
      <ScannedServerStatusIndicator status={server.status} />
      <Typography variant="body2">
        {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
      </Typography>
    </Box>
    <Typography variant="body2">
      <strong>Address:</strong> {server.address}
    </Typography>
  </Box>
);
