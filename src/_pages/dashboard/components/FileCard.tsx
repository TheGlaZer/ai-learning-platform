"use client";
import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { FileMetadata } from '@/app/models/file';
import useFileDownload from '@/hooks/useFileDownload';
import { useRTL } from '@/contexts/RTLContext';

// Type to map file extensions to display types
interface FileTypeMap {
  [key: string]: {
    label: string;
    icon: React.ReactNode;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
}

// Add more types as needed
const FILE_TYPES: FileTypeMap = {
  pdf: { 
    label: 'PDF', 
    icon: <PictureAsPdfOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'error'
  },
  doc: { 
    label: 'DOC', 
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'primary'
  },
  docx: { 
    label: 'DOCX', 
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'primary'
  },
  txt: { 
    label: 'TXT', 
    icon: <ArticleOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'secondary'
  },
  jpg: { 
    label: 'JPG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'success'
  },
  jpeg: { 
    label: 'JPEG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'success'
  },
  png: { 
    label: 'PNG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
    color: 'success'
  }
};

// Default for any unrecognized file type
const DEFAULT_FILE_TYPE = { 
  label: 'FILE', 
  icon: <InsertDriveFileOutlinedIcon sx={{ fontSize: 24, color: 'black' }} />, 
  color: 'default' as const
};

interface FileCardProps {
  file?: FileMetadata;
  onClick?: (file: FileMetadata) => void;
  onDelete?: (file: FileMetadata) => void;
  onEdit?: (file: FileMetadata) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onClick, onDelete, onEdit }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { downloadFile, isDownloading, error } = useFileDownload();
  const { isRTL } = useRTL();

  // Early return if file is undefined
  if (!file) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleMenuCloseGeneric = () => {
    setAnchorEl(null);
  };

  const handleClick = () => {
    onClick?.(file);
  };

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    
    if (file.url) {
      downloadFile(file.url, file.name || 'download');
    }
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    onEdit?.(file);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${file.name || 'this file'}"?`)) {
      onDelete?.(file);
    }
  };

  // Get the file extension (lowercase)
  let fileExtension = '';
  if (file.name) {
    const lastDotIndex = file.name.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      fileExtension = file.name.substring(lastDotIndex + 1).toLowerCase();
    }
  }

  // Determine the file type display
  const fileTypeInfo = FILE_TYPES[fileExtension] || DEFAULT_FILE_TYPE;

  // Format the creation date
  const formattedDate = file.created_at 
    ? new Date(file.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Unknown date';

  return (
    <>
      <Card
        sx={{
          mb: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardActionArea
          onClick={handleClick}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <CardContent sx={{ p: 1.5, pb: 1, flexGrow: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'space-between', 
              mb: 0.5,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                maxWidth: 'calc(100% - 50px)',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <Avatar 
                  sx={{ 
                    mr: isRTL ? 0 : 1,
                    ml: isRTL ? 1 : 0,
                    width: 28, 
                    height: 28, 
                    bgcolor: 'white',
                    border: '1px solid #d0d0d0',
                    color: 'black'
                  }}
                >
                  {fileTypeInfo.icon}
                </Avatar>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                  {file.name || 'Unnamed File'}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ 
                  ml: isRTL ? 'unset' : 'auto',
                  mr: isRTL ? 'auto' : 'unset',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } 
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mt: 0.5,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
              <Chip 
                label={fileTypeInfo.label} 
                size="small" 
                color={fileTypeInfo.color}
                variant="outlined"
                sx={{ height: 18, '& .MuiChip-label': { px: 1, fontSize: '0.6rem' } }}
              />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuCloseGeneric}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { 
            direction: isRTL ? 'rtl' : 'ltr',
            minWidth: 180
          }
        }}
      >
        <MenuItem onClick={handleDownload} disabled={isDownloading}>
          <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
            <OpenInNewOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{isDownloading ? 'Opening...' : 'Open File'}</ListItemText>
        </MenuItem>
        
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <DeleteOutlinedIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete File</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default FileCard;