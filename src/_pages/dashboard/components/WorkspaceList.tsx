"use client";
import React from 'react';
import { Typography } from '@mui/material';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import WorkspaceCard from './WorkspaceCard';
import { EmptyStateContainer, EmptyStateText } from './DashboardStyledComponents';

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
        <EmptyStateContainer>
          <EmptyStateText>
            You don't have any workspaces yet. Create your first workspace to get started.
          </EmptyStateText>
        </EmptyStateContainer>
      ) : (
        workspaces?.map((workspace) => (
          <WorkspaceCard 
            key={workspace.id}
            workspace={workspace} 
            onClick={onWorkspaceSelect}
          />
        ))
      )}
    </>
  );
};

export default WorkspaceList;