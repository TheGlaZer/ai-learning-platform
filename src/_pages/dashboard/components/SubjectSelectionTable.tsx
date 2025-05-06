"use client";
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  Typography,
  Box,
  Tooltip,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TagIcon from '@mui/icons-material/Tag';
import styled from '@emotion/styled';
import * as colors from '../../../../colors';
import { Subject } from '@/app/models/subject';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslations } from 'next-intl';

const StyledTableContainer = styled(Box)`
  max-height: 500px;
  border-radius: 12px;
  overflow: auto;
  margin-bottom: 1rem;
  height: 100%;
  
  &:hover {
    background-color: ${colors.background.lightest};
  }
  
  /* Customize scrollbar for a more elegant look */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${colors.background.lighter};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${colors.border.medium};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.border.dark};
  }
`;

const StyledTable = styled(Table)`
  min-width: 400px;
  table-layout: fixed;
`;

const TableHeaderCell = styled(TableCell)`
  background-color: ${colors.background.lighter};
  color: ${colors.text.primary};
  font-weight: 600;
  border-bottom: 1px solid ${colors.border.light};
  padding: 12px 16px;
`;

const StyledTableRow = styled(TableRow)<{ $isPriority: boolean }>`
  cursor: pointer;
  background-color: ${props => props.$isPriority ? `${colors.primary.light}30` : 'inherit'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isPriority ? `${colors.primary.light}50` : colors.background.hover};
  }
  
  &:last-child td, &:last-child th {
    border-bottom: 0;
  }

  & td {
    border-bottom: 1px solid ${colors.border.light}30;
    padding: 12px 16px;
  }
`;

const SubjectName = styled(Box)<{ $isPriority: boolean }>`
  display: flex;
  align-items: center;
  color: ${props => props.$isPriority ? colors.primary.dark : colors.text.primary};
  font-weight: ${props => props.$isPriority ? 600 : 400};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const EmptyMessage = styled(Typography)`
  padding: 2rem;
  text-align: center;
  color: ${colors.text.secondary};
  width: 100%;
`;

const ActionButtonsContainer = styled(Box)<{ isRTL: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.isRTL ? 'flex-start' : 'flex-end'};
  gap: 8px;
`;

const StyledIconButton = styled(IconButton)<{ $isPriority?: boolean }>`
  transition: all 0.2s ease;
  opacity: ${props => props.$isPriority ? 1 : 0.6};
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

interface SubjectSelectionTableProps {
  subjects: Subject[];
  selectedSubjectIds: string[];
  highPrioritySubjectIds: string[];
  isLoading: boolean;
  onSubjectClick: (subjectId: string) => void;
  onSubjectRemove: (subjectId: string) => void;
  disabled?: boolean;
}

const SubjectSelectionTable: React.FC<SubjectSelectionTableProps> = ({
  subjects,
  selectedSubjectIds,
  highPrioritySubjectIds,
  isLoading,
  onSubjectClick,
  onSubjectRemove,
  disabled = false
}) => {
  const { isRTL } = useRTL();
  const t = useTranslations('QuizGeneration');
  
  // Filter subjects to only show selected ones
  const selectedSubjects = subjects.filter(subject => 
    selectedSubjectIds.includes(subject.id || '')
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (selectedSubjects.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: colors.background.lighter }}>
        <EmptyMessage>
          {t('noSubjects')}
        </EmptyMessage>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, height: '100%' }}>
      <StyledTableContainer>
        <StyledTable stickyHeader aria-label="subject selection table">
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('subject')}</TableHeaderCell>
              <TableHeaderCell align={isRTL ? "left" : "right"} sx={{ width: 100 }}>
                {t('actions')}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedSubjects.map((subject) => {
              const subjectId = subject.id || '';
              const isPriority = highPrioritySubjectIds.includes(subjectId);
              
              return (
                <StyledTableRow 
                  key={subjectId} 
                  $isPriority={isPriority}
                  onClick={() => !disabled && onSubjectClick(subjectId)}
                >
                  <TableCell component="th" scope="row">
                    <SubjectName $isPriority={isPriority}>
                      <TagIcon sx={{ 
                        mr: isRTL ? 0 : 1, 
                        ml: isRTL ? 1 : 0, 
                        color: isPriority ? colors.primary.main : colors.text.secondary 
                      }} />
                      {subject.name}
                    </SubjectName>
                  </TableCell>
                  <TableCell align={isRTL ? "left" : "right"}>
                    <ActionButtonsContainer isRTL={isRTL}>
                      <Tooltip title={t('clickToMarkPriority')}>
                        <StyledIconButton 
                          size="small"
                          disabled={disabled}
                          color={isPriority ? "primary" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            !disabled && onSubjectClick(subjectId);
                          }}
                          $isPriority={isPriority}
                        >
                          {isPriority ? <StarIcon /> : <StarBorderIcon />}
                        </StyledIconButton>
                      </Tooltip>
                      <Tooltip title={t('removeSubject')}>
                        <StyledIconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            !disabled && onSubjectRemove(subjectId);
                          }}
                          disabled={disabled}
                          $isPriority={isPriority}
                        >
                          <DeleteIcon fontSize="small" color={disabled ? "disabled" : "error"} />
                        </StyledIconButton>
                      </Tooltip>
                    </ActionButtonsContainer>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </StyledTable>
      </StyledTableContainer>
    </Paper>
  );
};

export default SubjectSelectionTable; 