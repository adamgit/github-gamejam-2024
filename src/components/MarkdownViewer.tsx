import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  useTheme,
  Divider
} from '@mui/material';
import { ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { VirtualFile } from '../data/OperatingSystem';
import ReactMarkdown from 'react-markdown';

interface MarkdownViewerProps {
  fileToOpen: VirtualFile;
}

export default function MarkdownViewer({ fileToOpen }: MarkdownViewerProps) {
    const [content, setContent] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const theme = useTheme();

  const loadText = async (sourcePath: string): Promise<string> => {
    // Now sourcePath is a URL like image paths
    const response = await fetch(sourcePath);
    if (!response.ok) {
        throw new Error(`Failed to load text file: ${response.statusText} -- attempting to use path: ${sourcePath}`);
    }
    return response.text();
};

useEffect(() => {
  const fetchContent = async () => {
    if (!fileToOpen?.backingFile) {
      setContent(null); // Clear content if no file is provided
      return;
    }
    try {
      const loadedContent = await loadText(fileToOpen.backingFile);
      setContent(loadedContent);
    } catch (error) {
      console.error('Error loading markdown file:', error);
      setContent('Error loading content.');
    }
  };

    fetchContent(); // Load the text file when the component mounts
}, [fileToOpen]);

  if (!fileToOpen) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
          color: 'text.secondary'
        }}
      >
        <FileText size={48} />
        <Typography variant="h6">
          No document selected
        </Typography>
        <Typography variant="body2">
          Open a markdown file to view it here
        </Typography>
      </Box>
    );
  }

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 8));
  };

  const renderContent = () => {
    if (!fileToOpen.backingFile) {
      return (
        <Typography variant="body1" color="error">
          Unable to load document
        </Typography>
      );
    }

    if (content === null) {
        return <p>Loading...</p>; // Render a loading state
    }

    return (
      <Box sx={{ 
        typography: 'body1',
        fontSize: `${fontSize}px`,
        '& h1': {
          fontSize: '2em',
          fontWeight: 'bold',
          mb: 2,
          color: 'primary.main'
        },
        '& h2': {
          fontSize: '1.5em',
          fontWeight: 'bold',
          mb: 1.5,
          color: 'primary.main'
        },
        '& p': {
          mb: 2
        },
        '& blockquote': {
          borderLeft: 4,
          borderColor: 'primary.main',
          pl: 2,
          py: 1,
          bgcolor: 'action.hover',
          mx: 0
        },
        '& code': {
          fontFamily: 'monospace',
          bgcolor: 'grey.100',
          p: 0.5,
          borderRadius: 1
        },
        '& pre': {
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
          overflow: 'auto'
        },
        '& ul, & ol': {
          pl: 3,
          mb: 2
        }
      }}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'background.default' 
    }}>
      <Paper elevation={1} sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}>
        <IconButton onClick={handleZoomOut}>
          <ZoomOut />
        </IconButton>
        <Typography variant="body2">
          {fontSize}px
        </Typography>
        <IconButton onClick={handleZoomIn}>
          <ZoomIn />
        </IconButton>
        <Divider orientation="vertical" flexItem />
        <Typography 
          variant="body2" 
          sx={{ ml: 'auto', color: 'text.secondary' }}
        >
          {fileToOpen.filename}
        </Typography>
      </Paper>
      
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: 3,
        bgcolor: 'background.paper'
      }}>
        {renderContent()}
      </Box>
    </Box>
  );
}