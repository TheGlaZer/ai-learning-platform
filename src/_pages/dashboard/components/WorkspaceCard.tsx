"use client";
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Workspace } from '@/app/models/workspace';

interface WorkspaceCardProps {
  workspace?: Workspace;
  onClick?: (workspace: Workspace) => void;
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, onClick, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Early return if workspace is undefined
  if (!workspace) {
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
    onClick?.(workspace);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    onEdit?.(workspace);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${workspace.name || 'this workspace'}"?`)) {
      onDelete?.(workspace);
    }
  };

  // Format the date nicely if available
  const formattedDate = workspace.created_at 
    ? new Date(workspace.created_at).toLocaleDateString(undefined, { 
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
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                  {workspace.name || 'Unnamed Workspace'}
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
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

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
            <ListItemText>Edit Workspace</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Workspace</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default WorkspaceCard;