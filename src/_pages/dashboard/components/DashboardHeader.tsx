"use client";
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import styled from '@emotion/styled';
import { useRTL } from '@/contexts/RTLContext';
import { Workspace } from '@/app/models/workspace';
import ActionMenu from './ActionMenu';
import { useResponsive } from '@/hooks/useResponsive';
import { gradients, text } from '../../../../colors';

// Styled components
const HeaderContainer = styled(Box)<{ isRTL: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1.5rem;
  padding-left: ${({ isRTL }) => isRTL ? '0' : '2rem'};
  padding-right: ${({ isRTL }) => isRTL ? '2rem' : '0'};
  
  @media (max-width: 600px) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const WorkspaceTitle = styled(Typography)`
  font-weight: 700;
  background: ${gradients.textGradient};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2.3rem;
  
  @media (max-width: 600px) {
    font-size: 1.8rem;
  }
`;

const WorkspaceDescription = styled(Typography)`
  color: ${text.secondary};
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  
  @media (max-width: 600px) {
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }
`;

interface DashboardHeaderProps {
  selectedWorkspace: Workspace | null;
  onMenuToggle: () => void;
  onGenerateSubjects: () => void;
  onGenerateQuiz: () => void;
  onUploadFile: () => void;
  onUploadPastExam: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedWorkspace,
  onMenuToggle,
  onGenerateSubjects,
  onGenerateQuiz,
  onUploadFile,
  onUploadPastExam
}) => {
  const { isRTL } = useRTL();
  const { isMobile } = useResponsive();
  
  if (!selectedWorkspace) return null;
  
  return (
    <HeaderContainer isRTL={isRTL}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isMobile && (
          <IconButton 
            onClick={onMenuToggle}
            sx={{ 
              color: text.primary,
              display: { xs: 'flex', md: 'none' } 
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box>
          <WorkspaceTitle variant="h5">{selectedWorkspace.name}</WorkspaceTitle>
          {selectedWorkspace.description && (
            <WorkspaceDescription variant="body1">
              {selectedWorkspace.description}
            </WorkspaceDescription>
          )}
        </Box>
      </Box>
      
      <ActionMenu
        onGenerateSubjects={onGenerateSubjects}
        onGenerateQuiz={onGenerateQuiz}
        onUploadFile={onUploadFile}
        onUploadPastExam={onUploadPastExam}
      />
    </HeaderContainer>
  );
};

export default DashboardHeader; 