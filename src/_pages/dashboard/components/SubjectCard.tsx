"use client";
import React, { useState } from 'react';
import {
  CardContent,
  CardActionArea,
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
import { accent } from '../../../../colors';
import {
  BaseCard,
  CardHeader,
  CardTitleContainer,
  CardIconAvatar,
  CardTitle,
  CardMenuButton,
  CardFooter,
  CardDate,
  CardChip
} from './DashboardStyledComponents';

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
      <BaseCard>
        <CardActionArea onClick={handleClick}>
          <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
            <CardHeader>
              <CardTitleContainer>
                <CardIconAvatar sx={{ bgcolor: accent.green.light, width: 28, height: 28 }}>
                  <SubjectIcon fontSize="small" />
                </CardIconAvatar>
                <CardTitle variant="subtitle1">
                  {subject.name || 'Unnamed Subject'}
                </CardTitle>
              </CardTitleContainer>
              <CardMenuButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="subject options"
              >
                <MoreVertIcon fontSize="small" />
              </CardMenuButton>
            </CardHeader>
            
            <CardFooter>
              <CardDate variant="caption">
                {formattedDate}
              </CardDate>
              {subject.source === 'auto' && (
                <CardChip 
                  label="AI Generated" 
                  size="small" 
                  color="secondary"
                  variant="outlined"
                />
              )}
            </CardFooter>
          </CardContent>
        </CardActionArea>
      </BaseCard>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { 
            minWidth: 180,
            borderRadius: '8px',
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Subject" />
        </MenuItem>
        
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Subject" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default SubjectCard; 