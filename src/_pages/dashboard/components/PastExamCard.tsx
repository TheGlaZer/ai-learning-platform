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
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { PastExam } from '@/app/models/pastExam';

interface PastExamCardProps {
  pastExam?: PastExam;
  onClick?: (pastExam: PastExam) => void;
  onDelete?: (pastExam: PastExam) => void;
  onEdit?: (pastExam: PastExam) => void;
}

const PastExamCard: React.FC<PastExamCardProps> = ({ pastExam, onClick, onDelete, onEdit }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
                    bgcolor: 'info.light',
                    color: 'info.main'
                  }}
                >
                  <HistoryEduIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                  {pastExam.name || 'Unnamed Exam'}
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

            {(yearInfo || semesterInfo || courseInfo) && (
              <Box sx={{ mt: 1, mb: 1 }}>
                {courseInfo && (
                  <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    Course: {courseInfo}
                  </Typography>
                )}
                {(yearInfo || semesterInfo) && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {yearInfo && (
                      <Chip 
                        label={yearInfo} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                      />
                    )}
                    {semesterInfo && (
                      <Chip 
                        label={semesterInfo} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
              <Chip 
                label="EXAM" 
                size="small" 
                color="info"
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
            <ListItemText>Delete Exam</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PastExamCard; 