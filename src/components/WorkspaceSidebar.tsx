'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Collapse,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon as MenuItemIcon
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/app/models/workspace';
import { useState } from 'react';
import { createWorkspaceClient } from '@/app/lib-client/workspaceClient';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceDialog from '@/_pages/dashboard/components/WorkspaceDialog';
import DeleteWorkspaceDialog from '@/_pages/dashboard/components/DeleteWorkspaceDialog';
import { useTranslations } from 'next-intl';
import { primary, accent, text, surface, background, gradients } from '../../colors';

interface WorkspaceSidebarProps {
  width?: number;
}

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ width = 250 }) => {
  const { 
    workspaces, 
    selectedWorkspace, 
    loading, 
    error, 
    selectWorkspace,
    fetchWorkspaces,
    deleteWorkspace
  } = useWorkspace();
  
  const { userId, accessToken } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const handleWorkspaceClick = (workspace: Workspace) => {
    selectWorkspace(workspace);
  };
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleOpenDialog = () => {
    handleMenuClose();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = () => {
    handleMenuClose();
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteWorkspace = async (): Promise<boolean> => {
    if (!selectedWorkspace?.id) return false;
    
    try {
      const success = await deleteWorkspace(selectedWorkspace.id);
      return success;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }
  };

  const handleCreateWorkspace = async (name: string, description?: string): Promise<boolean> => {
    if (!userId || isCreating) return false;
    
    try {
      setIsCreating(true);
      const newWorkspace = await createWorkspaceClient(userId, name, description, accessToken);
      
      // Refresh workspaces list
      await fetchWorkspaces();
      
      return true;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          width,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: surface.paper,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: surface.border,
            background: `linear-gradient(135deg, ${primary.light}05, ${accent.purple.light}10)`,
          }}
        >
          <Box display="flex" alignItems="center">
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{
                background: gradients.textGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Workspaces
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleToggleExpand}
              sx={{ 
                ml: 0.5,
                color: primary.main
              }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Box display="flex" alignItems="center">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="workspace options"
              aria-controls={menuOpen ? 'workspace-menu' : undefined}
              aria-expanded={menuOpen ? 'true' : undefined}
              aria-haspopup="true"
              sx={{ color: text.secondary }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Workspace List */}
        <Collapse in={expanded} sx={{ overflow: 'auto', flexGrow: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: primary.main }} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2" sx={{ px: 2, py: 2 }}>
              {error}
            </Typography>
          ) : workspaces.length === 0 ? (
            <Typography variant="body2" sx={{ px: 2, py: 2, color: text.secondary }}>
              No workspaces found. Create your first workspace to get started.
            </Typography>
          ) : (
            <List disablePadding>
              {workspaces.map((workspace) => (
                <ListItem key={workspace.id} disablePadding>
                  <ListItemButton
                    selected={selectedWorkspace?.id === workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: alpha(primary.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(primary.main, 0.2),
                        },
                      },
                      '&:hover': {
                        bgcolor: background.hover
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderIcon 
                        fontSize="small" 
                        color={selectedWorkspace?.id === workspace.id ? "primary" : "action"} 
                        sx={{ 
                          color: selectedWorkspace?.id === workspace.id ? primary.main : text.secondary
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={workspace.name}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: selectedWorkspace?.id === workspace.id ? 'bold' : 'normal',
                        noWrap: true,
                        color: selectedWorkspace?.id === workspace.id ? text.primary : text.secondary
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Collapse>
      </Paper>

      {/* Workspace Menu */}
      <Menu
        id="workspace-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'workspace-options-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 180,
            borderRadius: '8px',
            overflow: 'visible',
            mt: 0.5,
            boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: surface.paper,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: background.hover
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleOpenDialog} disabled={isCreating || !userId}>
          <ListItemIcon>
            <AddIcon fontSize="small" sx={{ color: accent.green.main }} />
          </ListItemIcon>
          <ListItemText primary="New Workspace" />
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog} disabled={!selectedWorkspace || isCreating}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: accent.yellow.dark }} />
          </ListItemIcon>
          <ListItemText primary="Delete Current Workspace" />
        </MenuItem>
      </Menu>

      {/* Workspace Dialog */}
      <WorkspaceDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {/* Delete Workspace Dialog */}
      <DeleteWorkspaceDialog 
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onDeleteWorkspace={handleDeleteWorkspace}
        workspaceName={selectedWorkspace?.name}
      />
    </>
  );
};

export default WorkspaceSidebar; 