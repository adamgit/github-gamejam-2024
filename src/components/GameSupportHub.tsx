import React from 'react';
import { Box, Typography, Button, Paper, Alert, Divider, Link } from '@mui/material';
import { ExternalLink, MessagesSquare, AlertTriangle } from 'lucide-react';

export default function GameSupportHub() {
  const handleJoinDiscord = () => {
    window.open('https://discord.gg/UGp2d8DcNQ', '_blank');
  };

  return (
    <Box className="w-full h-full bg-white p-4">
      <Alert 
        severity="info" 
        icon={<AlertTriangle className="text-blue-500" />}
        className="mb-4"
      >
        This window connects to external websites outside the game
      </Alert>

      <Paper elevation={3} className="p-6">
        <Box className="flex items-center gap-3 mb-4">
          <MessagesSquare size={32} className="text-purple-600" />
          <div>
            <Typography variant="h5" color="primary" className="font-bold">
              Join Our Community
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with players outside the game
            </Typography>
          </div>
        </Box>

        <Divider className="my-4" />

        <Box className="space-y-4">
          <Typography variant="body1">
            Join our Discord server to:
          </Typography>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>Get help and tips from other players</li>
            <li>Share your achievements and discoveries</li>
            <li>Participate in community events</li>
            <li>Report bugs and suggest features</li>
          </ul>

          <Typography>
            Since you're reading this help page ... a little hint: try opening a new Terminal and typing 'opensesame',
            and look at bottom right of the screen
          </Typography>

          <Box className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Typography variant="subtitle2" color="error" className="mb-2 flex items-center gap-2">
              <ExternalLink size={16} />
              External Website Notice
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clicking the button below will open Discord in your browser, outside of the game environment.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            className="bg-[#5865F2] hover:bg-[#4752C4] mt-4"
            onClick={handleJoinDiscord}
            startIcon={<MessagesSquare />}
            endIcon={<ExternalLink size={16} />}
          >
            Open Discord in Browser
          </Button>

          <Typography variant="caption" color="text.secondary" className="block text-center mt-2">
            Discord is a separate application not affiliated with this game
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}