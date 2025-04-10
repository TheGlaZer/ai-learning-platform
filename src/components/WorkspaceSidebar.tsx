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
  alpha
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/app/models/workspace';
import { useState } from 'react';
import { createWorkspaceClient } from '@/app/lib-client/workspaceClient';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceDialog from '@/pages/dashboard/components/WorkspaceDialog';

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
    fetchWorkspaces
  } = useWorkspace();
  
  const { userId, accessToken } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  const handleWorkspaceClick = (workspace: Workspace) => {
    selectWorkspace(workspace);
  };
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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
          bgcolor: 'background.paper',
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
            borderColor: 'divider',
          }}
        >
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">
              Workspaces
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleToggleExpand}
              sx={{ ml: 0.5 }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Tooltip title="Create workspace">
            <IconButton
              size="small"
              onClick={handleOpenDialog}
              disabled={isCreating || !userId}
            >
              {isCreating ? <CircularProgress size={20} /> : <AddIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Workspace List */}
        <Collapse in={expanded} sx={{ overflow: 'auto', flexGrow: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2" sx={{ px: 2, py: 2 }}>
              {error}
            </Typography>
          ) : workspaces.length === 0 ? (
            <Typography variant="body2" sx={{ px: 2, py: 2, color: 'text.secondary' }}>
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
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderIcon 
                        fontSize="small" 
                        color={selectedWorkspace?.id === workspace.id ? "primary" : "action"} 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={workspace.name}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: selectedWorkspace?.id === workspace.id ? 'bold' : 'normal',
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Collapse>
      </Paper>

      {/* Workspace Dialog */}
      <WorkspaceDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </>
  );
};

export default WorkspaceSidebar; 