"use client";
import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SubjectIcon from '@mui/icons-material/Subject';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Subject } from '@/app/models/subject';

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const StyledActionArea = styled(CardActionArea)`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

interface SubjectCardProps {
  subject?: Subject;
  onClick?: (subject: Subject) => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Early return if subject is undefined
  if (!subject) {
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

  const handleClick = () => {
    onClick?.(subject);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    onEdit?.(subject);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${subject.name || 'this subject'}"?`)) {
      onDelete?.(subject);
    }
  };

  // Format the date nicely if available
  const formattedDate = subject.createdAt 
    ? new Date(subject.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'Unknown date';

  return (
    <>
      <StyledCard>
        <StyledActionArea onClick={handleClick}>
          <CardContent sx={{ p: 2, pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 'calc(100% - 50px)' }}>
                <SubjectIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                  {subject.name || 'Unnamed Subject'}
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
              {subject.source === 'auto' && (
                <Chip 
                  label="AI Generated" 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                />
              )}
            </Box>
          </CardContent>
        </StyledActionArea>
      </StyledCard>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Subject</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Subject</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default SubjectCard; 