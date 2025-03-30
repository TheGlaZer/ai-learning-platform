"use client";
import React from 'react';
import { 
  Box, 
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';

interface WorkspaceCardProps {
  workspace: Workspace;
  files: FileMetadata[];
  isSelected?: boolean;
  onClick: (workspace: Workspace) => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ 
  workspace, 
  files, 
  isSelected = false,
  onClick 
}) => {
  return (
    <Card 
      key={workspace.id} 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        border: isSelected ? '2px solid' : 'none',
        borderColor: 'primary.main',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
        }
      }}
      onClick={() => onClick(workspace)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <FolderIcon sx={{ mr: 2 }} color={isSelected ? "primary" : "action"} />
          <Typography variant="h6">{workspace.name}</Typography>
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            {files?.length || 0} files
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkspaceCard;