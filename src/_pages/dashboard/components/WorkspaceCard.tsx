"use client";
import React, { useState } from 'react';
import {
  CardActionArea,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { Workspace } from '@/app/models/workspace';
import {
  BaseCard,
  CardHeader,
  CardTitleContainer,
  CardIconAvatar,
  CardTitle,
  CardMenuButton,
  CardFooter,
  CardDate
} from './DashboardStyledComponents';
import { accent } from '../../../../colors';
import LinearProgress from '@mui/material/LinearProgress';

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
      <BaseCard sx={{ mb: 2 }}>
        <CardActionArea onClick={handleClick}>
          <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
            <CardHeader>
              <CardTitleContainer>
                <CardIconAvatar sx={{ bgcolor: 'white', width: 28, height: 28, border: '1px solid #d0d0d0' }}>
                  <FolderOutlinedIcon fontSize="small" sx={{ color: 'black' }} />
                </CardIconAvatar>
                <CardTitle variant="subtitle1">
                  {workspace.name || 'Unnamed Workspace'}
                </CardTitle>
              </CardTitleContainer>
              <CardMenuButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="workspace options"
              >
                <MoreVertIcon fontSize="small" />
              </CardMenuButton>
            </CardHeader>
            
            <CardFooter>
              <CardDate variant="caption">
                {formattedDate}
              </CardDate>
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
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit Workspace" />
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteOutlinedIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete Workspace" sx={{ color: 'error.main' }} />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default WorkspaceCard;