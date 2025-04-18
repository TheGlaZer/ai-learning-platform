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
  ListItemIcon as MenuItemIcon,
  styled
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/app/models/workspace';
import { useState } from 'react';
import { createWorkspaceClient } from '@/app/lib-client/workspaceClient';
import { useAuth } from '@/contexts/AuthContext';
import WorkspaceDialog from '@/_pages/dashboard/components/WorkspaceDialog';
import DeleteWorkspaceDialog from '@/_pages/dashboard/components/DeleteWorkspaceDialog';
import { useTranslations } from 'next-intl';
import { primary, accent, text, surface, background, gradients } from '../../colors';
import { useRTL } from '@/contexts/RTLContext';

// Styled Components
const SidebarContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  overflow: 'visible',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease',
  position: 'relative',
  bgcolor: surface.paper,
  borderRight: '1px solid',
  borderColor: surface.border,
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 70,
  right: 0,
  transform: 'translateX(50%)',
  backgroundColor: 'white',
  border: `1px solid #d0d0d0`,
  borderRadius: '50%',
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  color: 'black',
  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid',
  borderColor: surface.border,
  background: `linear-gradient(135deg, ${primary.light}05, ${accent.purple.light}10)`,
}));

const CollapsedSidebarContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 0',
  overflow: 'hidden',
}));

interface WorkspaceSidebarProps {
  width?: number;
  onToggleCollapse?: (collapsed: boolean) => void;
}

// Custom hook for sidebar state management
const useWorkspaceSidebarCollapse = (defaultWidth = 250, collapsedWidth = 60, onToggleCollapse?: (collapsed: boolean) => void) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const { isRTL } = useRTL();

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setWidth(newCollapsedState ? collapsedWidth : defaultWidth);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };

  return {
    isCollapsed,
    width,
    toggleCollapse,
    getToggleIcon: () => {
      if (isRTL) {
        return isCollapsed ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />;
      } else {
        return isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />;
      }
    }
  };
};

const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ 
  width: initialWidth = 250,
  onToggleCollapse
}) => {
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
  const { isRTL } = useRTL();
  const [expanded, setExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const t = useTranslations('Workspace');

  // Use the custom hook for sidebar collapse state
  const { isCollapsed, width, toggleCollapse, getToggleIcon } = useWorkspaceSidebarCollapse(
    initialWidth, 
    60, // collapsedWidth
    onToggleCollapse
  );
  
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

  const handleCreateWorkspace = async (name: string): Promise<boolean> => {
    if (!userId || isCreating) return false;
    
    try {
      setIsCreating(true);
      const newWorkspace = await createWorkspaceClient(userId, name, undefined, accessToken);
      
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
      <SidebarContainer
        elevation={0}
        sx={{
          width,
        }}
      >
        {/* Toggle button to collapse/expand sidebar */}
        <ToggleButton
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          sx={{
            right: isRTL ? 'auto' : 0,
            left: isRTL ? 0 : 'auto',
            transform: isRTL ? 'translateX(-50%)' : 'translateX(50%)',
          }}
        >
          {getToggleIcon()}
        </ToggleButton>

        {isCollapsed ? (
          // Collapsed sidebar view
          <CollapsedSidebarContent>
            <Tooltip title={t('workspaces')} placement={isRTL ? "left" : "right"}>
              <FolderOutlinedIcon sx={{ color: 'black', mb: 2, bgcolor: 'white', borderRadius: '4px' }} />
            </Tooltip>
            
            {!loading && workspaces.length > 0 && (
              <List disablePadding sx={{ width: '100%' }}>
                {workspaces.map((workspace) => (
                  <ListItem key={workspace.id} disablePadding>
                    <Tooltip title={workspace.name} placement={isRTL ? "left" : "right"}>
                      <ListItemButton
                        selected={selectedWorkspace?.id === workspace.id}
                        onClick={() => handleWorkspaceClick(workspace)}
                        sx={{
                          justifyContent: 'center',
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
                        <FolderOutlinedIcon 
                          fontSize="small" 
                          sx={{ 
                            color: 'black',
                            bgcolor: 'white',
                            borderRadius: '2px'
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            )}
            
            {loading && (
              <CircularProgress size={24} sx={{ color: primary.main, my: 2 }} />
            )}
            
            <Box sx={{ mt: 'auto', width: '100%', p: 1 }}>
              <Tooltip title={t('newWorkspace')} placement={isRTL ? "left" : "right"}>
                <ListItemButton
                  onClick={handleOpenDialog}
                  sx={{
                    justifyContent: 'center',
                    borderRadius: 1,
                    p: 1,
                    '&:hover': {
                      backgroundColor: background.hover
                    }
                  }}
                >
                  <AddIcon fontSize="small" sx={{ color: primary.main }} />
                </ListItemButton>
              </Tooltip>
            </Box>
          </CollapsedSidebarContent>
        ) : (
          // Expanded sidebar view
          <>
            {/* Header */}
            <SidebarHeader>
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
                  {t('workspaces')}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleToggleExpand}
                  sx={{ 
                    ml: isRTL ? 0 : 0.5,
                    mr: isRTL ? 0.5 : 0,
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
            </SidebarHeader>
            
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
                  {t('noWorkspaces')}
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
                          <FolderOutlinedIcon 
                            fontSize="small" 
                            sx={{ 
                              color: 'black',
                              bgcolor: 'white',
                              borderRadius: '2px'
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={workspace.name}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: selectedWorkspace?.id === workspace.id ? 'bold' : 'normal',
                            noWrap: true,
                            color: selectedWorkspace?.id === workspace.id ? text.primary : text.secondary,
                            textAlign: isRTL ? 'right' : 'left'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Collapse>
          </>
        )}
      </SidebarContainer>
      
      {/* Workspace Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 180,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              [isRTL ? 'left' : 'right']: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <MenuItem onClick={handleOpenDialog} disabled={isCreating || !userId}>
          <ListItemIcon>
            <AddIcon fontSize="small" sx={{ color: accent.green.main }} />
          </ListItemIcon>
          <ListItemText primary={t('newWorkspace')} />
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog} disabled={!selectedWorkspace || isCreating}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: accent.yellow.dark }} />
          </ListItemIcon>
          <ListItemText primary={t('deleteWorkspace')} />
        </MenuItem>
      </Menu>
      
      {/* Dialogs */}
      <WorkspaceDialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        onCreateWorkspace={handleCreateWorkspace} 
      />
      
      <DeleteWorkspaceDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onDeleteWorkspace={handleDeleteWorkspace}
        workspaceName={selectedWorkspace?.name || ''}
      />
    </>
  );
};

export default WorkspaceSidebar; 