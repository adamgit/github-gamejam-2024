import React from 'react';
import { 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Box,
  Chip,
  Card,
  CardHeader,
  CardContent,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MissionTemplate, MissionEvent } from '../types/mission';
import MissionManager, { MissionStatus } from '../missionsystem/MissionManager';
import { GameServices } from '../gameServices';

const MissionEventDebugger = () => {
    const [missions, setMissions] = React.useState<MissionStatus[]>([]);
    const theme = useTheme();
    
    React.useEffect(() => {
      const updateMissions = () => {
        const activeMissions = GameServices.missions.getActiveMissions();
        setMissions(activeMissions);
      };
  
      const interval = setInterval(updateMissions, 1000);
      updateMissions(); // Initial load
      return () => clearInterval(interval);
    }, []);
  
    const getStatusColor = (status) => {
      switch (status) {
        case 'active':
          return { backgroundColor: '#81c784', color: '#fff' };
        case 'pending':
          return { backgroundColor: '#64b5f6', color: '#fff' };
        case 'completed':
          return { backgroundColor: '#e0e0e0', color: '#000' };
        case 'failed':
          return { backgroundColor: '#e57373', color: '#fff' };
        default:
          return { backgroundColor: '#e0e0e0', color: '#000' };
      }
    };
  
    const getTimeRemaining = (event) => {
      if (!event.trigger?.timeoutMs || !event.trigger.startTime) return 'N/A';
      const endTime = event.trigger.startTime + event.trigger.timeoutMs;
      const remaining = endTime - Date.now();
      return remaining > 0 ? `${Math.ceil(remaining / 1000)}s` : '0s';
    };
  
    return (
      <Box sx={{ padding: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        {missions.length === 0 ? (
          <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            No active missions
          </Typography>
        ) : (
          missions.map(mission => (
            <Card key={mission.id} sx={{ mb: 3 }}>
              <CardHeader
                sx={{ py: 2 }}
                action={
                  <Chip
                    label="Cancel"
                    color="error"
                    onClick={() => GameServices.missions.cancelMission(mission.id)}
                    sx={{ cursor: 'pointer' }}
                  />
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" component="span">
                      Mission: {mission.id}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="span">
                      ({mission.template.title})
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <Box 
                sx={{ 
                  px: 2, 
                  py: 1.5, 
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 'medium',
                    minWidth: 'fit-content'
                  }}
                >
                  Variables:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(mission.variables).map(([key, value]) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: 'primary.main',
                          fontFamily: 'monospace'
                        }}
                      >
                        {key}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mx: 0.5 }}
                      >
                        =
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.primary',
                          fontFamily: 'monospace'
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <CardContent>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time Remaining</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(mission.events).map(([eventName, event]) => (
                      <TableRow key={eventName}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            size="small"
                            sx={getStatusColor(event.status)}
                          />
                        </TableCell>
                        <TableCell>{getTimeRemaining(event)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    );
};

export default MissionEventDebugger;