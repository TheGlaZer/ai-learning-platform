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
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FileMetadata } from '@/app/models/file';

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
    icon: <PictureAsPdfIcon sx={{ fontSize: 24 }} />, 
    color: 'error'
  },
  doc: { 
    label: 'DOC', 
    icon: <DescriptionIcon sx={{ fontSize: 24 }} />, 
    color: 'primary'
  },
  docx: { 
    label: 'DOCX', 
    icon: <DescriptionIcon sx={{ fontSize: 24 }} />, 
    color: 'primary'
  },
  txt: { 
    label: 'TXT', 
    icon: <ArticleIcon sx={{ fontSize: 24 }} />, 
    color: 'secondary'
  },
  jpg: { 
    label: 'JPG', 
    icon: <ImageIcon sx={{ fontSize: 24 }} />, 
    color: 'success'
  },
  jpeg: { 
    label: 'JPEG', 
    icon: <ImageIcon sx={{ fontSize: 24 }} />, 
    color: 'success'
  },
  png: { 
    label: 'PNG', 
    icon: <ImageIcon sx={{ fontSize: 24 }} />, 
    color: 'success'
  }
};

// Default for any unrecognized file type
const DEFAULT_FILE_TYPE = { 
  label: 'FILE', 
  icon: <InsertDriveFileIcon sx={{ fontSize: 24 }} />, 
  color: 'default' as const
};

interface FileCardProps {
  file: FileMetadata;
  onClick: (file: FileMetadata) => void;
  onDelete?: (file: FileMetadata) => void;
  onEdit?: (file: FileMetadata) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onClick, onDelete, onEdit }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
    onClick(file);
  };

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    
    // Create an anchor element and set the href to the file URL
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    // Confirm before deleting
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onDelete?.(file);
    }
  };

  // Get the file extension (lowercase)
  let fileExtension = '';
  const lastDotIndex = file.name.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    fileExtension = file.name.substring(lastDotIndex + 1).toLowerCase();
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
          <CardContent sx={{ p: 2, pb: 1.5, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 'calc(100% - 50px)' }}>
                <Avatar 
                  sx={{ 
                    mr: 1, 
                    width: 32, 
                    height: 32, 
                    bgcolor: `${fileTypeInfo.color}.light`,
                    color: `${fileTypeInfo.color}.main`
                  }}
                >
                  {fileTypeInfo.icon}
                </Avatar>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                  {file.name}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ 
                  ml: 'auto', 
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } 
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
              <Chip 
                label={fileTypeInfo.label} 
                size="small" 
                color={fileTypeInfo.color}
                variant="outlined"
                sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <GetAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete File</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default FileCard;