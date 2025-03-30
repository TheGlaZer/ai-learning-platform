"use client";
import React from 'react';
import { 
  Card, 
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Avatar
} from '@mui/material';
import { FileMetadata } from '@/app/models/file';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';

interface FileCardProps {
  file: FileMetadata;
  onDelete: () => void;
  onEdit: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onEdit }) => {
  // Get appropriate file icon path by file extension or type
  const getFileIconPath = (fileName: string, fileType: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'doc' || extension === 'docx' || fileType === 'word') {
      return '/word-icon.svg';
    }
    if (extension === 'ppt' || extension === 'pptx' || fileType === 'powerpoint') {
      return '/powerpoint-icon.svg';
    }
    if (extension === 'pdf' || fileType === 'pdf') {
      return '/pdf-icon.svg';
    }
    
    // Default icons based on file_type
    switch (fileType) {
      case 'document':
        return '/word-icon.svg';
      case 'presentation':
        return '/powerpoint-icon.svg';
      case 'summary':
        return '/pdf-icon.svg';
      case 'quiz':
        return '/file.svg';
      default:
        return '/file.svg';
    }
  };

  // Format the date nicely
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Get appropriate color for file type chip
  const getChipColor = (fileType: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (fileType) {
      case 'document':
      case 'word':
        return 'primary';
      case 'presentation':
      case 'powerpoint':
        return 'warning';
      case 'pdf':
        return 'error';
      case 'summary':
        return 'secondary';
      case 'quiz':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get appropriate background color for file icon
  const getIconBgColor = (fileType: string): string => {
    switch (fileType) {
      case 'document':
      case 'word':
        return 'rgba(25, 118, 210, 0.08)';
      case 'presentation':
      case 'powerpoint':
        return 'rgba(255, 167, 38, 0.08)';
      case 'pdf':
        return 'rgba(211, 47, 47, 0.08)';
      case 'summary':
        return 'rgba(156, 39, 176, 0.08)';
      case 'quiz':
        return 'rgba(2, 136, 209, 0.08)';
      default:
        return 'rgba(0, 0, 0, 0.04)';
    }
  };

  // Get display label for the file type
  const getFileTypeLabel = (fileName: string, fileType: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'doc' || extension === 'docx') return 'Word';
    if (extension === 'ppt' || extension === 'pptx') return 'PowerPoint';
    if (extension === 'pdf') return 'PDF';
    
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  };

  const iconPath = getFileIconPath(file.name, file.file_type);
  const fileTypeLabel = getFileTypeLabel(file.name, file.file_type);
  
  return (
    <Card 
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardContent sx={{ pt: 2, pb: 1, px: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Avatar 
            variant="rounded"
            src={iconPath}
            alt={`${fileTypeLabel} file`}
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              bgcolor: getIconBgColor(file.file_type),
              p: 1,
            }}
          />
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" component="div" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontWeight: 600,
              lineHeight: 1.2,
              mb: 0.5
            }}>
              {file.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={fileTypeLabel}
                size="small"
                color={getChipColor(file.file_type)}
                sx={{ 
                  height: '22px', 
                  '& .MuiChip-label': { 
                    px: 1,
                    fontSize: '0.7rem',
                    fontWeight: 500
                  } 
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {formatDate(file.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {file.metadata && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {file.metadata.description || 'No description available'}
            </Typography>
          </>
        )}
      </CardContent>
      
      <CardActions disableSpacing sx={{ 
        justifyContent: 'flex-end', 
        p: 1, 
        bgcolor: 'rgba(0, 0, 0, 0.02)',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <Tooltip title="Download">
          <IconButton size="small" color="primary" sx={{ mr: 0.5 }}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit file">
          <IconButton onClick={onEdit} size="small" color="primary" sx={{ mr: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete file">
          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default FileCard;