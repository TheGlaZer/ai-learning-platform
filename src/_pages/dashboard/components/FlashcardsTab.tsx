"use client";
import React from 'react';
import { Box, Typography } from '@mui/material';
import FlashcardBoard from '@/components/flashcards/FlashcardBoard';
import { Workspace } from '@/app/models/workspace';
import { ContentScrollArea } from './DashboardStyledComponents';

interface FlashcardsTabProps {
  workspace: Workspace;
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ workspace }) => {
  if (!workspace) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Select a workspace to view flashcards
        </Typography>
      </Box>
    );
  }

  return (
    <ContentScrollArea>
      <FlashcardBoard workspaceId={workspace.id} />
    </ContentScrollArea>
  );
};

export default FlashcardsTab; 