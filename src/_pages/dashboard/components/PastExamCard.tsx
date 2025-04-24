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
  Chip,
} from '@mui/material';
import GetAppOutlinedIcon from '@mui/icons-material/GetAppOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import { PastExam } from '@/app/models/pastExam';
import { useRTL } from '@/contexts/RTLContext';

interface PastExamCardProps {
  pastExam?: PastExam;
  onClick?: (pastExam: PastExam) => void;
  onDelete?: (pastExam: PastExam) => void;
  onEdit?: (pastExam: PastExam) => void;
}

const PastExamCard: React.FC<PastExamCardProps> = ({ pastExam, onClick, onDelete, onEdit }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { isRTL } = useRTL();

  // Early return if pastExam is undefined
  if (!pastExam) {
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
    onClick?.(pastExam);
  };

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    
    if (typeof window !== 'undefined' && pastExam.url) {
      // Create an anchor element and set the href to the file URL
      const link = document.createElement('a');
      link.href = pastExam.url;
      link.download = pastExam.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    onEdit?.(pastExam);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${pastExam.name || 'this past exam'}"?`)) {
      onDelete?.(pastExam);
    }
  };

  // Format the creation date
  const formattedDate = pastExam.created_at 
    ? new Date(pastExam.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Unknown date';

  // Get year and semester information for display
  const yearInfo = pastExam.year || '';
  const semesterInfo = pastExam.semester || '';
  const courseInfo = pastExam.course || '';

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
        {/* Exam Icon - Larger size */}
        <Box 
          sx={{ 
            width: 70, 
            height: 70, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            color: '#9c27b0'
          }}
        >
          <HistoryEduOutlinedIcon sx={{ fontSize: 60 }} />
        </Box>
        
        {/* Exam Name with Tooltip */}
        <Tooltip title={pastExam.name || 'Unnamed Exam'}>
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
            {pastExam.name || 'Unnamed Exam'}
          </Typography>
        </Tooltip>
        
        {/* Course Info if available */}
        {courseInfo && (
          <Typography 
            variant="caption" 
            color="text.primary" 
            align="center"
            sx={{ mt: 0.5 }}
          >
            {courseInfo}
          </Typography>
        )}
        
        {/* Year and Semester */}
        {(yearInfo || semesterInfo) && (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            mt: 0.5,
            justifyContent: 'center'
          }}>
            {yearInfo && (
              <Chip 
                label={yearInfo} 
                size="small" 
                color="primary"
                variant="outlined"
                sx={{ height: 18, '& .MuiChip-label': { px: 1, fontSize: '0.6rem' } }}
              />
            )}
            {semesterInfo && (
              <Chip 
                label={semesterInfo} 
                size="small" 
                color="secondary"
                variant="outlined"
                sx={{ height: 18, '& .MuiChip-label': { px: 1, fontSize: '0.6rem' } }}
              />
            )}
          </Box>
        )}
        
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
        <MenuItem onClick={handleDownload} disabled={!pastExam.url}>
          <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
            <GetAppOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
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
            <ListItemText>Delete Exam</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PastExamCard; 