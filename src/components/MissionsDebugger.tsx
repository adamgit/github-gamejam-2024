import React, { useState, useEffect } from 'react';
import { MissionTemplate } from '../types/mission';
import MissionStats from './MissionStats';
import MissionTemplateRegistry from '../missionsystem/MissionTemplateRegistry';
import MissionManager from '../missionsystem/MissionManager';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  ButtonGroup,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  RestartAlt as ResetIcon,
  Search as InspectIcon
} from '@mui/icons-material';
import { GameServices } from '../gameServices';

export default function MissionsDebugger() {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [missionStats, setMissionStats] = useState<Record<string, { succeeded: number; failed: number }>>({}); // to force react to re-render on change
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTemplates( GameServices.missions.getAllMissionTemplates());
      setActiveMissions(GameServices.missions.getActiveMissions());
      // Update stats (started/failed/succeeded) for all templates
      const newStats = templates.reduce((acc, template) => ({
          ...acc,
          [template.templateID]: {
            succeeded: GameServices.missions.countSucceededByTemplate(template.templateID),
            failed: GameServices.missions.countFailedByTemplate(template.templateID)
          }
        }), {});
        setMissionStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
    const interval = setInterval(loadMissions, 100);
    
    return () => clearInterval(interval);
  }, []);

  const getActiveMissionCount = (template: MissionTemplate) => {
       return activeMissions.filter(m => m.template.missionId === template.templateID).length;
     };

     const getMissionDisabledReason = (template: MissionTemplate): string => {
          if (!GameServices.missions.isMissionUnlocked(template)) {
            return 'LOCKED';
          }
          if (!GameServices.missions.isMissionResourceMet(template)) {
            return 'REP/COIN LOW';
          }
          if( !GameServices.missions.isMissionParallelizable(template))
          {
            return 'IN_PROGRESS';
          }
          if (!GameServices.missions.isMissionRerunnable(template)) {
            return 'MAX_ATTEMPTS';
          }
          if (!GameServices.missions.hasMissionWaitedEnoughBetweenRetries(template)) {
            return 'TOO_SOON';
          }
          return '';
        };

        const getMissionDisabledExtraInfo = (template: MissionTemplate): string => {
          if (!GameServices.missions.isMissionUnlocked(template)) {
            const by = template.blockedBy ? 'by: '+template.blockedBy : '';
            const until = template.blockedUntil ? 'until: '+template.blockedUntil : '';

            return `Blocked ${by} ${until}`;
          }
          if (!GameServices.missions.isMissionResourceMet(template)) {
            return 'REP or COIN too LOW';
          }
          if( !GameServices.missions.isMissionParallelizable(template))
          {
            return 'IN_PROGRESS';
          }
          if (!GameServices.missions.isMissionRerunnable(template)) {
            return 'MAX_ATTEMPTS';
          }
          if (!GameServices.missions.hasMissionWaitedEnoughBetweenRetries(template)) {

            const lastStartTime = GameServices.missions.statistics.lastAttemptStartTime(template.templateID) ?? 0;
    const lastEndTime = GameServices.missions.statistics.lastAttemptEndTime(template.templateID) ?? 0;
    const lastAttemptTime = Math.max(lastStartTime, lastEndTime);
            
            const timeSinceLastAttemptStart = (Date.now()-lastAttemptTime)/1000;
            const timeUntilNextAttempt = ((template.minSecondsBeforeRetryAfterFailure??0)-timeSinceLastAttemptStart);
            return `${timeSinceLastAttemptStart} seconds since last; wait ${timeUntilNextAttempt} seconds`;
          }
          return '';
        };

  const handleStartMission = async (template: MissionTemplate) => {
    try {
      if( GameServices.missions.canStartMission(template))
      {
      //console.log(`WILL START MISSION: ${JSON.stringify(template)}`)
      const missionId = await GameServices.missions.startMission(template);
      console.log('Started mission:', missionId);
      }
      else
      console.error(`Can't start mission; probably not eligble yet? - ${template}`);

    } catch (err) {
      console.error('Failed to start mission:', err);
      setError(err instanceof Error ? err.message : 'Failed to start mission');
    }
  };

  const handleForceStartMission = async (template: MissionTemplate) => {
    try {
      //console.log(`WILL START MISSION: ${JSON.stringify(template)}`)
      const missionId = await GameServices.missions.startMission(template, true);
      console.log('FORCE Started mission:', missionId);
    } catch (err) {
      console.error('Failed to FORCE start mission:', err);
      setError(err instanceof Error ? err.message : 'Failed to FORCE start mission');
    }
  };

  const handleResetMission = (template:MissionTemplate) => {
    alert("not implemented yet");
  }

  const handleInspectMission = (template:MissionTemplate) => {
    alert("not implemented yet");
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'grey.100' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadMissions}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
      Mission Templates
    </Typography>
    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
      Unlocked keys: {GameServices.missions.locker.getUnlockedKeys().join(', ') || 'none'}
    </Typography>
  </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mission ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>
      <Tooltip title="active | succeeded | failed">
        <div>Attempts</div>
      </Tooltip>
    </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {templates.length === 0 ? (
    <TableRow>
      <TableCell colSpan={4} align="center">
        <Typography color="textSecondary">
          No mission templates found
        </Typography>
      </TableCell>
    </TableRow>
  ) : (
    templates.map((template) => (
      <>
        {/* Template Row */}
        <TableRow
          key={`template-${template.templateID}`}
          sx={{
            backgroundColor: GameServices.missions.canStartMission(template)
              ? 'rgba(76, 175, 80, 0.1)'
              : getMissionDisabledReason(template) === 'IN_PROGRESS'
       ? 'rgba(255, 235, 59, 0.2)' // Yellow for IN_PROGRESS
       : 'rgba(244, 67, 54, 0.1)',
            '&:hover': {
              backgroundColor: GameServices.missions.canStartMission(template)
                ? 'rgba(76, 175, 80, 0.2)'
                : getMissionDisabledReason(template) === 'IN_PROGRESS'
         ? 'rgba(255, 235, 59, 0.3)'
                : 'rgba(244, 67, 54, 0.2)',
            },
   margin: '2px', // Reduce margin
   height: 'auto', // Adjust row height
          }}
        >
          <TableCell sx={{ padding: '4px', width: 'auto', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{template.templateID}</TableCell>
          <TableCell sx={{ padding: '4px', width: 'auto', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {template.title}
            {!GameServices.missions.canStartMission(template) && (
              <Tooltip title={getMissionDisabledExtraInfo(template)}>
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  ({getMissionDisabledReason(template)})
                </Typography>
              </Tooltip>
            )}
          </TableCell>
          <TableCell sx={{padding: '4px', }}>
            <MissionStats 
              template={template}
              activeMissions={getActiveMissionCount(template)}
              maxConcurrent={String(template.maxConcurrentInstances) || '∞'}
              stats={missionStats}
            />
          </TableCell>
          <TableCell sx={{padding: '4px', }}>
            <ButtonGroup size="small" variant="outlined">
              {GameServices.missions.canStartMission(template) && (
                <Button
                  startIcon={<StartIcon />}
                  onClick={() => handleStartMission(template)}
                  color="success"
                >
                  Start
                </Button>
              )}
              <Button
                startIcon={<StartIcon />}
                onClick={() => handleForceStartMission(template)}
                color="warning"
              >
                FORCE
              </Button>
              <Button
                startIcon={<ResetIcon />}
                onClick={() => handleResetMission(template)}
                color="warning"
              >
                Reset
              </Button>
              <Button
                startIcon={<InspectIcon />}
                onClick={() => handleInspectMission(template)}
                color="info"
              >
                Inspect
              </Button>
            </ButtonGroup>
          </TableCell>
        </TableRow>

        {/* Sub-Rows for Active Missions */}
        {activeMissions
          .filter((mission) => mission.template.templateID === template.templateID)
          .map((mission) => (
            <TableRow
              key={`mission-${mission.id}`}
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            >
              <TableCell sx={{ pl: 4 }}>{mission.id}</TableCell>
              <TableCell>Rewards: {JSON.stringify(mission.template.reward)}</TableCell>
              <TableCell sx={{
    pl: 4,
   whiteSpace: 'normal',
   wordWrap: 'break-word',
   maxWidth: '300px', // Optional limit for large content
  }}>
                <Typography variant="caption">
                  Variables: {JSON.stringify(mission.variables)}
                </Typography>
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() =>
                    GameServices.missions.endMissionSuccess(mission.id, mission.template.templateID)
                  }
                >
                  Instant Success
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </>
    ))
  )}
</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}