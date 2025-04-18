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
                    color: 'black',
                    border: '1px solid #d0d0d0'
                  }}
                >
                  <HistoryEduOutlinedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                  {pastExam.name || 'Unnamed Exam'}
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

            {(yearInfo || semesterInfo || courseInfo) && (
              <Box sx={{ mt: 0.5, mb: 0.5 }}>
                {courseInfo && (
                  <Typography variant="caption" color="text.primary" sx={{ mb: 0.25, display: 'block' }}>
                    Course: {courseInfo}
                  </Typography>
                )}
                {(yearInfo || semesterInfo) && (
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    flexWrap: 'wrap',
                    flexDirection: isRTL ? 'row-reverse' : 'row' 
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
              </Box>
            )}
            
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
                label="EXAM" 
                size="small" 
                color="info"
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
          elevation: 2,
          sx: { 
            minWidth: 180,
            borderRadius: '8px',
            mt: 0.5,
            direction: isRTL ? 'rtl' : 'ltr'
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