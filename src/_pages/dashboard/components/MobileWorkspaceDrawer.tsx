"use client";
import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton, 
  Box, 
  Typography, 
  Divider
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@emotion/styled';
import { Workspace } from '@/app/models/workspace';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import { accent, primary, text, surface, gradients } from '../../../../colors';

// Styled components
const DrawerHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const HeaderTitle = styled(Typography)`
  font-weight: 700;
  background: ${gradients.textGradient};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const WorkspaceButton = styled(ListItemButton)<{ selected?: boolean }>`
  border-radius: 8px;
  margin: 4px 8px;
  background-color: ${props => props.selected ? `${primary.light}20` : 'transparent'};
  
  &:hover {
    background-color: ${props => props.selected ? `${primary.light}30` : `${surface.background}80`};
  }
`;

const AddWorkspaceButton = styled(ListItemButton)`
  border-radius: 8px;
  margin: 4px 8px;
  color: ${accent.green.main};
  
  &:hover {
    background-color: ${accent.green.light}20;
  }
`;

interface MobileWorkspaceDrawerProps {
  open: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
}

const MobileWorkspaceDrawer: React.FC<MobileWorkspaceDrawerProps> = ({
  open,
  onClose,
  workspaces,
  selectedWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace
}) => {
  const t = useTranslations('Workspace');
  const { isRTL } = useRTL();
  
  const handleWorkspaceClick = (workspace: Workspace) => {
    onWorkspaceSelect(workspace);
    onClose();
  };
  
  const handleCreateClick = () => {
    onCreateWorkspace();
    onClose();
  };
  
  return (
    <Drawer
      anchor={isRTL ? 'right' : 'left'}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: '85%',
          maxWidth: '300px',
          borderRadius: isRTL ? '16px 0 0 16px' : '0 16px 16px 0',
        },
      }}
    >
      <DrawerHeader>
        <HeaderTitle variant="h6">{t('workspaces')}</HeaderTitle>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
      
      <Divider />
      
      <List sx={{ pt: 1 }}>
        {workspaces.map((workspace) => (
          <ListItem key={workspace.id} disablePadding>
            <WorkspaceButton
              selected={selectedWorkspace?.id === workspace.id}
              onClick={() => handleWorkspaceClick(workspace)}
            >
              <FolderOutlinedIcon 
                sx={{ 
                  mr: 2, 
                  color: selectedWorkspace?.id === workspace.id ? primary.main : text.secondary 
                }}
              />
              <ListItemText 
                primary={workspace.name}
                primaryTypographyProps={{
                  fontWeight: selectedWorkspace?.id === workspace.id ? 'bold' : 'normal',
                  color: selectedWorkspace?.id === workspace.id ? primary.main : text.primary,
                }}
              />
            </WorkspaceButton>
          </ListItem>
        ))}
        
        <ListItem disablePadding>
          <AddWorkspaceButton onClick={handleCreateClick}>
            <AddIcon sx={{ mr: 2 }} />
            <ListItemText primary={t('newWorkspace')} />
          </AddWorkspaceButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default MobileWorkspaceDrawer; 