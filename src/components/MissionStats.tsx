import { Typography, Box } from '@mui/material';
import { GameServices } from '../gameServices';
import React from 'react';

export default function MissionStats({ 
  template, 
  activeMissions, 
  maxConcurrent = '∞',
  stats,
}) {
  const active = activeMissions;
  const succeeded = stats[template.missionId]?.succeeded ?? 0;
  const failed = stats[template.missionId]?.failed ?? 0;

  return (
    <Box className="flex items-center space-x-2">
      <Typography
        component="span"
        className={active > 0 ? 'text-black' : 'text-gray-500'}
      >
        {active}/{maxConcurrent}
      </Typography>
      <Typography component="span" className="text-gray-500">|</Typography>
      <Typography
        component="span" 
        className="text-green-600"
      >
        {succeeded}
      </Typography>
      <Typography component="span" className="text-gray-500">|</Typography>
      <Typography
        component="span"
        className="text-red-600"
      >
        {failed}
      </Typography>
    </Box>
  );
}