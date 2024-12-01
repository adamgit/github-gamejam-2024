import React, { useState, useEffect } from 'react';
import { Box, Button, Hidden, Paper, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield, ShieldAlert } from 'lucide-react';

import { useOS, useOSState } from '../hooks/useOperatingSystem';
import { IntrusionService } from '../backgroundservices/desktopservices/service-intrusion';

const NICIntrusionMonitor = ({ updateInterval = 500, lockdownDuration = 30 }) => {
    const os = useOS();
    const intrusionService:IntrusionService = os.intrusionService;
    const [data, setData] = useState(Array(30).fill({ 
        traffic: 50, 
        anomaly: 0,
        timestamp: Date.now() 
      }));
    
    const [baseAnomalyLevel, setBaseAnomalyLevel] = useState(0);
    const [threatAnomalyLevel, setThreatAnomalyLevel] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockdownEndTime, setLockdownEndTime] = useState(0);
    const [activityLog, setActivityLog] = useState({ text: '', threat: 0 });

    useEffect(() => {
        const callback = ({severity, type}: {severity: number, type: string}) =>
            {

                    setThreatAnomalyLevel(severity);
                    setActivityLog({
                        text: `INTRUSION ATTEMPT (${type.toUpperCase()})`,
                        threat: severity / 100
                    });
                };
        
                intrusionService.onIntrusionAttempt.addListener(callback);

                return () => {
                    intrusionService.onIntrusionAttempt.removeListener(callback);
                };
            }, []);
  
    const anomalyLevel = Math.max(baseAnomalyLevel, threatAnomalyLevel);

  const activities = [
    { text: "ping 192.168.1.1", threat: 0.1 },
    { text: "DNS lookup: gameserver.net", threat: 0.2 },
    { text: "Port scan detected", threat: 0.8 },
    { text: "Failed login attempt", threat: 0.7 },
    { text: "New connection: 45.33.22.11", threat: 0.4 },
    { text: "SSH session established", threat: 0.3 },
    { text: "Dictionary attack detected", threat: 0.9 },
    { text: "HTTP GET /admin", threat: 0.6 }
  ];

  useEffect(() => {
    const updateNetworkData = () => {
        setData(prev => {
            const lastTraffic = prev[prev.length - 1].traffic ?? 50;
            const newTraffic = Math.max(0, Math.min(100, 
                lastTraffic + (Math.random() - 0.5) * 20
            ));
          return [...prev.slice(1), { 
            traffic: newTraffic,
            anomaly: Math.max(baseAnomalyLevel, threatAnomalyLevel),
            timestamp: Date.now() 
          }];
        });
      };

    const updateBaseAnomaly = () => {
      setBaseAnomalyLevel(prev => {
        const newLevel = prev + (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, newLevel));
      });
    };

    const updateActivity = () => {
      setActivityLog(activities[Math.floor(Math.random() * activities.length)]);
    };

    const timer = setInterval(() => {
      updateNetworkData();
      updateBaseAnomaly();
      updateActivity();
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval, baseAnomalyLevel, threatAnomalyLevel]);

  useEffect(() => {
    const decayTimer = setInterval(() => {
      setThreatAnomalyLevel(prev => Math.max(0, prev - 5));
    }, 1000);
    return () => clearInterval(decayTimer);
  }, []);

  const handleTest = () => {
    setTimeout(() => {
      setThreatAnomalyLevel(95);
      setActivityLog({ text: "BREACH ATTEMPT DETECTED", threat: 1.0 });
    }, 2000);
  };
  const handleLockdown = () => {
    intrusionService.suspendNetworkInterface();
    setIsLocked(true);
    setLockdownEndTime(Date.now() + lockdownDuration*1000);
    setTimeout(() => {
        intrusionService.restoreNetworkInterface();
      setIsLocked(false);
      setLockdownEndTime(0);
    }, lockdownDuration*1000);
  };

  return (
    <Box sx={{ height: '100%', 
        //position: 'relative',
         display: 'flex', flexDirection: 'column',

        position: 'absolute', 
      top: 30,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden' 
     }}>
      {isLocked && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Shield size={64} color="#4CAF50" />
          <Typography variant="h5" color="white">
            SYSTEM LOCKDOWN ACTIVE
          </Typography>
          <Typography color="white">
            All hacking attempts blocked for {Math.ceil((lockdownEndTime - Date.now()) / 1000)} seconds
          </Typography>
        </Box>
      )}

      <Paper 
        elevation={3}
        sx={{
            boxSizing: 'border-box', 
            position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,

          flex: 1,
          //p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap:0,
          bgcolor: 'black',
          border: '1px solid',
          borderColor: anomalyLevel > 70 ? 'error.main' : 'primary.main',
          transition: 'border-color 0.3s ease',
          '& > *:not(:last-child)': { mb: 2 } // Replace gap with margin
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" color={anomalyLevel > 70 ? 'error.main' : 'primary.main'}>
            Network Activity Monitor
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleTest}
            >
              Test Alert
            </Button>
            {anomalyLevel > 70 && <ShieldAlert color="error" />}
            <Button
              variant="contained"
              color="error"
              onClick={handleLockdown}
              disabled={isLocked}
            >
              EMERGENCY LOCKDOWN
            </Button>
          </Box>
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: `rgba(255,${255 * (1 - activityLog.threat)},${255 * (1 - activityLog.threat)},0.8)`,
            fontFamily: 'monospace'
          }}
        >
          {activityLog.text}
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
      <XAxis 
        dataKey="timestamp" 
        tickFormatter={(time) => new Date(time).toLocaleTimeString()} 
        stroke="rgba(255,255,255,0.5)"
      />
      <YAxis 
        label={{ value: 'Network Load', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
        stroke="rgba(255,255,255,0.5)"
      />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="traffic"
        name="Network Traffic"
        stroke='#2196f3'
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="anomaly"
        name="Threat Level"
        stroke="#f44336"
        strokeWidth={1}
        dot={false}
        isAnimationActive={false}
        strokeDasharray="5 5"
      />
    </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              flex: 1,
              height: 20,
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${anomalyLevel}%`,
                bgcolor: anomalyLevel > 70 ? 'error.main' : 'primary.main',
                transition: 'all 0.3s ease'
              }}
            />
          </Box>
          <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ minWidth: 200 }}>
            Anomaly Level: {Math.round(anomalyLevel)}%
            {anomalyLevel > 70 && " - SUSPICIOUS ACTIVITY DETECTED"}
            {anomalyLevel > 90 && " - CRITICAL THREAT LEVEL"}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default NICIntrusionMonitor;