import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Avatar, Divider } from '@mui/material';
import { ReputationService } from '../backgroundservices/desktopservices/service-reputation';
import { useOS } from '../hooks/useOperatingSystem';
  
const ReputationCard: React.FC = () => {
  const [reputation, setReputation] = useState(0);
  const os = useOS();
  const repService = os.repService;

  useEffect(() => {
    // Initialize reputation
    setReputation(repService.getReputation());

    // Subscribe to updates
    const handleReputationChange = (newReputation: number) => {
      setReputation(newReputation);
    };

    repService.onReputationChanged.addListener(handleReputationChange);

    return () => {
      repService.onReputationChanged.removeListener(handleReputationChange);
    };
  }, []);

  return (
    <Card
      style={{
        width: '350px',
        backgroundColor: '#1d1d1d',
        color: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Box
        style={{
          height: '100px',
          backgroundImage: 'linear-gradient(135deg, #00c6ff, #0072ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" style={{ color: '#fff', fontWeight: 'bold' }}>
          Hacking Cred
        </Typography>
      </Box>
      <CardContent style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
        <Avatar
          src="/path/to/blurred-avatar.jpg"
          alt="Player Avatar"
          style={{ width: '80px', height: '80px', marginRight: '16px' }}
        />
        <Box style={{ flexGrow: 1 }}>
          <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Reputation
          </Typography>
          <Typography
            variant="h3"
            style={{
              fontWeight: 'bold',
              color: '#00c6ff',
              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            {reputation}
          </Typography>
        </Box>
      </CardContent>
      <Divider style={{ backgroundColor: '#444' }} />
      <Box style={{ padding: '16px', textAlign: 'center' }}>
        <Typography variant="body2" style={{ color: '#bbb' }}>
          Level up your hacking skills to increase your reputation!
        </Typography>
      </Box>
    </Card>
  );
};

export default ReputationCard;