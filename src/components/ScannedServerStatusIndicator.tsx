// components/ScannedServerStatusIndicator.tsx
import { styled } from '@mui/material';
import { ScannedServerInfo } from './NetworkMonitorTypes';

const statusColorMap: Record<ScannedServerInfo['status'], string> = {
  hackable: '#4caf50',
  potential: '#ff9800',
  secure: '#f44336',
  unknown: '#757575',
};

export const ScannedServerStatusIndicator = styled('div')<{ status: ScannedServerInfo['status'] }>(
  ({ status }) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: statusColorMap[status],
    marginRight: 8,
  })
);
