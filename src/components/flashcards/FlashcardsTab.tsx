"use client";
import React from 'react';
import { Box, Typography } from '@mui/material';
import FlashcardBoard from './FlashcardBoard';
import { Workspace } from '@/app/models/workspace';
import { useTranslations } from 'next-intl';

interface FlashcardsTabProps {
  workspace: Workspace;
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ workspace }) => {
  const t = useTranslations('Dashboard');

  if (!workspace) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" gutterBottom>
          {t('selectWorkspacePrompt')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <FlashcardBoard workspaceId={workspace.id} />
    </Box>
  );
};

export default FlashcardsTab; 