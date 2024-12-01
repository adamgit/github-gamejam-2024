import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Typography,
  Slider,
  Paper
} from '@mui/material';
import { ZoomIn, ZoomOut, RotateCw, ImageOff } from 'lucide-react';
import { VirtualFile, VirtualFolder } from '../data/OperatingSystem';

interface ImageViewerProps {
  fileToOpen: VirtualFile;
}

export default function ImageViewer({ fileToOpen }: ImageViewerProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
  
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
          <ImageOff size={48} />
          <Typography variant="h6">
            No image selected
          </Typography>
          <Typography variant="body2">
            Open an image file to view it here
          </Typography>
        </Box>
      );
    }
  
    const handleZoomIn = () => {
      setZoom(prev => Math.min(prev + 10, 200));
    };
  
    const handleZoomOut = () => {
      setZoom(prev => Math.max(prev - 10, 10));
    };
  
    const handleRotate = () => {
      setRotation(prev => (prev + 90) % 360);
    };
  
    const renderImage = () => {
      let src = '';
      if (fileToOpen.backingFile) {
        src = fileToOpen.backingFile;
      }/* else if (fileToOpen.binaryData) {
        const blob = new Blob([fileToOpen.binaryData], { type: fileToOpen.mimetype });
        src = URL.createObjectURL(blob);
      }*/
  
      return src ? (
        <img
          src={src}
          alt={fileToOpen.filename}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
            transition: 'transform 0.3s ease'
          }}
        />
      ) : (
        <Typography variant="body1" color="error">
          Unable to load image
        </Typography>
      );
    };
  
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Paper elevation={1} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleZoomOut}>
            <ZoomOut />
          </IconButton>
          <Slider
            value={zoom}
            onChange={(_, value) => setZoom(value as number)}
            min={10}
            max={200}
            sx={{ width: 100 }}
          />
          <IconButton onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={handleRotate}>
            <RotateCw />
          </IconButton>
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            {zoom}%
          </Typography>
        </Paper>
        
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'auto',
          p: 2
        }}>
          {renderImage()}
        </Box>
      </Box>
    );
  }