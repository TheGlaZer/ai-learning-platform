"use client";
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
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
import styled from '@emotion/styled';
import { accent } from '../../../../colors';

// Type to map file extensions to display types
interface FileTypeMap {
  [key: string]: {
    label: string;
    icon: React.ReactNode;
    color: string;
  };
}

// Add more types as needed with larger icon sizes
const FILE_TYPES: FileTypeMap = {
  pdf: { 
    label: 'PDF', 
    icon: <PictureAsPdfOutlinedIcon sx={{ fontSize: 60, color: '#f44336' }} />, 
    color: '#f44336'
  },
  doc: { 
    label: 'DOC', 
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 60, color: '#2196f3' }} />, 
    color: '#2196f3'
  },
  docx: { 
    label: 'DOCX', 
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 60, color: '#2196f3' }} />, 
    color: '#2196f3'
  },
  txt: { 
    label: 'TXT', 
    icon: <ArticleOutlinedIcon sx={{ fontSize: 60, color: '#9c27b0' }} />, 
    color: '#9c27b0'
  },
  jpg: { 
    label: 'JPG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 60, color: '#4caf50' }} />, 
    color: '#4caf50'
  },
  jpeg: { 
    label: 'JPEG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 60, color: '#4caf50' }} />, 
    color: '#4caf50'
  },
  png: { 
    label: 'PNG', 
    icon: <ImageOutlinedIcon sx={{ fontSize: 60, color: '#4caf50' }} />, 
    color: '#4caf50'
  }
};

// Default for any unrecognized file type
const DEFAULT_FILE_TYPE = { 
  label: 'FILE', 
  icon: <InsertDriveFileOutlinedIcon sx={{ fontSize: 60, color: '#757575' }} />, 
  color: '#757575'
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
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '90%',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          p: 1.5,
          borderRadius: 1,
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)'
          }
        }}
      >
        {/* File Icon - Larger size */}
        <Box 
          sx={{ 
            width: 70, 
            height: 70, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            color: fileTypeInfo.color
          }}
        >
          {fileTypeInfo.icon}
        </Box>
        
        {/* File Name with Tooltip */}
        <Tooltip title={file.name || 'Unnamed File'}>
          <Typography 
            variant="body2" 
            align="center" 
            noWrap 
            sx={{ 
              width: '100%', 
              fontWeight: 500,
              fontSize: '0.875rem',
              lineHeight: 1.2
            }}
          >
            {file.name || 'Unnamed File'}
          </Typography>
        </Tooltip>
        
        {/* Date */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center"
          sx={{ mt: 0.5 }}
        >
          {formattedDate}
        </Typography>
        
        {/* Menu button (absolute positioned) */}
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            p: 0.5,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.95)'
            }
          }}
          component="div"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

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

const FileCardWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  
  @media (max-width: 600px) {
    padding: 0 4px;
  }
`;

const UploadCardContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 100%;
  position: relative;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px dashed ${accent.green.light};

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-color: ${accent.green.main};
  }
  
  @media (max-width: 600px) {
    padding: 8px;
    width: 100%;
    min-height: 100px;
  }
`;

export default FileCard;