import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  CardActionArea,
  CardMedia,
  Box,
  useTheme
} from '@mui/material';
import { 
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  File,
  Music,
  Video,
  Archive
} from 'lucide-react';
import { useOS } from '../hooks/useOperatingSystem';

// Map MIME types to icons
const getFileIcon = (mimetype) => {
  if (mimetype.startsWith('image/')) return Image;
  if (mimetype.startsWith('text/')) return FileText;
  if (mimetype.startsWith('audio/')) return Music;
  if (mimetype.startsWith('video/')) return Video;
  if (mimetype.includes('spreadsheet')) return FileSpreadsheet;
  if (mimetype.includes('javascript') || mimetype.includes('code')) return FileCode;
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return Archive;
  return File;
};

const FileCard = ({ file, onFileClick }) => {
  const theme = useTheme();
  const IconComponent = getFileIcon(file.mimetype);
  const isImage = file.mimetype.startsWith('image/');
  const isText = file.mimetype.startsWith('text/');
  
  const handleClick = (event) => {
    event.preventDefault();
    onFileClick(file);
  };

  // Format the date to be more readable
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPreview = () => {
       if (isImage && file.backingFile) {
         return (
           <CardMedia
             component="img"
             height="140"
             image={file.backingFile}
             alt={file.filename}
             sx={{ 
               objectFit: 'cover',
               backgroundColor: theme.palette.grey[100]
             }}
           />
         );
       }
       
       if (isText) {
         return (
           <Box
             sx={{
               height: 140,
               display: 'flex',
               flexDirection: 'column',
               p: 2,
               backgroundColor: theme.palette.grey[50],
               borderBottom: 1,
               borderColor: 'divider'
             }}
           >
             <IconComponent 
               size={24}
               color={theme.palette.primary.main}
             />
             <Typography
               variant="caption"
               sx={{
                 mt: 1,
                 color: 'text.secondary',
                 fontSize: '0.7rem',
                 lineHeight: 1.2,
                 overflow: 'hidden',
                 display: '-webkit-box',
                 WebkitLineClamp: 4,
                 WebkitBoxOrient: 'vertical'
               }}
             >
               [TEXT FILE: {file.filename}]
             </Typography>
           </Box>
         );
       }
    
       return (
         <Box
           sx={{
             height: 140,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             backgroundColor: theme.palette.grey[50]
           }}
         >
           <IconComponent 
             size={48}
             color={theme.palette.primary.main}
           />
         </Box>
       );
     };

  return (
    <Card 
      sx={{
        //height: '100%',
        width: '100%',
        height: '220px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardActionArea onClick={handleClick}>
      {renderPreview()}
        
 <CardContent sx={{ 
   py: 1,
   height: '120px',
   display: 'flex',
   flexDirection: 'column',
   justifyContent: 'space-between'
 }}>
          <Typography 
            variant="subtitle1"
            sx={{
              overflow: 'hidden',
              wordBreak: 'break-word',
              minHeight: '2.5em',
              fontWeight: 500,
              mb: 1
            }}
            title={file.filename}
          >
            {file.filename}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            {(file.size / 1024).toFixed(1)} KB
          </Typography>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            display="block"
            sx={{ fontSize: '0.7em' }}
          >
            Modified: {formatDate(file.modified)}
          </Typography>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            display="block"
            sx={{ fontSize: '0.7em' }}
          >
            Created: {formatDate(file.created)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const FolderViewer = ({ folder }) => {
  const files = folder?.getAllFiles() || [];
  const theme = useTheme();
  const os = useOS();

  const handleFileClick = (file) => {
    if (!os.openFile(file)) {
      console.warn(`No application available to open file: ${file.filename}`);
      // Could show a Material UI alert/snackbar here to inform the user
    }
  };

  return (
    <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
      <Box sx={{
   display: 'flex',
   flexWrap: 'wrap',
   gap: 2,
   '& > *': {
     flex: '1 1 400px',
     maxWidth: 'calc(50% - 8px)',
   }
 }}>
   {files.map((file) => (
     <FileCard
       key={file.filename}
       file={file}
       onFileClick={handleFileClick}
     />
   ))}
 </Box>
    </Box>
  );
};

export default FolderViewer;