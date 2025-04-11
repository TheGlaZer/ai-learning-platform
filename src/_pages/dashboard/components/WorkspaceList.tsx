"use client";
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import WorkspaceCard from './WorkspaceCard';

interface WorkspaceListProps {
  workspaces: Workspace[];
  workspaceFiles: Record<string, FileMetadata[]>;
  selectedWorkspace: Workspace | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ 
  workspaces, 
  workspaceFiles,
  selectedWorkspace,
  onWorkspaceSelect
}) => {
  return (
    <>
      {workspaces?.length == 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              You don't have any workspaces yet. Create your first workspace to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        workspaces?.map((workspace) => (
          <WorkspaceCard 
            key={workspace.id}
            workspace={workspace} 
            files={workspaceFiles[workspace.id] || []} 
            isSelected={selectedWorkspace?.id === workspace.id}
            onClick={onWorkspaceSelect}
          />
        ))
      )}
    </>
  );
};

export default WorkspaceList;