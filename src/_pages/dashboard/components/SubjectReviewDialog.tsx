"use client";
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { Subject } from '@/app/models/subject';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';

const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
`;

const StyledCloseButton = styled(IconButton)<{ isRTL?: boolean }>`
  margin-left: ${props => props.isRTL ? '0' : 'auto'};
  margin-right: ${props => props.isRTL ? 'auto' : '0'};
  transition: background-color 0.3s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }
`;

const StyledSectionTitle = styled(Typography)`
  font-weight: 600;
  margin-bottom: 16px;
`;

const SubjectsContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const StyledPaper = styled(Paper)`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled(Box)`
  padding: 16px;
  text-align: center;
  background-color: #f5f8ff;
  border-radius: 4px;
`;

const StyledAlert = styled(Alert)`
  margin-bottom: 16px;
`;

const StyledChip = styled(Chip)<{ isRTL?: boolean }>`
  & .MuiChip-deleteIcon {
    margin-left: ${props => props.isRTL ? '0' : '-4px'};
    margin-right: ${props => props.isRTL ? '-4px' : '0'};
  }
  
  /* Add better padding for the chip content */
  & .MuiChip-label {
    padding: 8px 12px;
    line-height: 1.4;
  }
  
  height: auto;
  margin: 4px;
`;

interface SubjectReviewDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  newSubjects: Subject[];
  existingSubjects: Subject[];
  onSaveSubjects: (subjects: Subject[]) => Promise<void>;
  updateSelectedSubjects?: (subjects: Subject[]) => void;
}

const SubjectReviewDialog: React.FC<SubjectReviewDialogProps> = ({
  open,
  onClose,
  workspaceId,
  userId,
  newSubjects,
  existingSubjects,
  onSaveSubjects,
  updateSelectedSubjects
}) => {
  const t = useTranslations('SubjectReview');
  const commonT = useTranslations('Common');
  const { isRTL } = useRTL();
  
  // Ensure newSubjects is always an array
  const safeNewSubjects = Array.isArray(newSubjects) ? newSubjects : [];
  
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize with all new subjects selected by default
  useEffect(() => {
    if (open && safeNewSubjects.length > 0) {
      setSelectedSubjects([...safeNewSubjects]);
    }
  }, [open, safeNewSubjects]);

  const handleToggleSubject = (subject: Subject) => {
    setSelectedSubjects(prev => {
      const isSelected = prev.some(s => 
        s.id === subject.id || 
        (!s.id && !subject.id && s.name === subject.name)
      );
      
      if (isSelected) {
        return prev.filter(s => 
          !(s.id === subject.id || (!s.id && !subject.id && s.name === subject.name))
        );
      } else {
        return [...prev, subject];
      }
    });
  };

  const isSubjectSelected = (subject: Subject) => {
    return selectedSubjects.some(s => 
      s.id === subject.id || 
      (!s.id && !subject.id && s.name === subject.name)
    );
  };

  const handleRemoveSubject = (subject: Subject) => {
    setSelectedSubjects(prev => 
      prev.filter(s => 
        !(s.id === subject.id || (!s.id && !subject.id && s.name === subject.name))
      )
    );
  };

  const handleRemoveExistingSubject = (subject: Subject) => {
    // Logic to handle removal of existing subject if needed
    console.log('Remove existing subject:', subject);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get only the new subjects that were selected
      // We don't need to save existing subjects as they're already in the database
      const subjectsToSave = selectedSubjects.filter(subject => 
        !existingSubjects.some(es => es.id === subject.id)
      );

      // Update selected subjects in the parent component if the function is provided
      if (updateSelectedSubjects) {
        updateSelectedSubjects(subjectsToSave);
      }

      await onSaveSubjects(subjectsToSave);
      setSuccess(true);
      
      // Close dialog after showing success state briefly
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save subjects:', err);
      setError(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Clear selected subjects when closing without saving
      if (updateSelectedSubjects) {
        updateSelectedSubjects([]);
      }
      
      setSelectedSubjects([]);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { direction: isRTL ? 'rtl' : 'ltr' } 
      }}
    >
      <StyledDialogTitle>
        <Typography variant="h6">{t('dialogTitle')}</Typography>
        <Tooltip title={commonT('back', { defaultValue: 'Back to generation' })}>
          <StyledCloseButton onClick={handleClose} isRTL={isRTL}>
            <CloseIcon />
          </StyledCloseButton>
        </Tooltip>
      </StyledDialogTitle>
      
      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <SaveIcon color="success" sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h6" color="success.main" fontWeight="600" gutterBottom>
              {t('saveSuccess')}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              {t('instructions')}
            </Typography>
            
            {/* Add note about returning to generation dialog */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {t('closeToReturnInfo', { defaultValue: 'You can close this review dialog to return to the subject generation screen. Subjects will only be saved if you click "Save Selected".' })}
              </Typography>
            </Alert>
            
            {error && (
              <StyledAlert severity="error" onClose={() => setError(null)}>
                {error}
              </StyledAlert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              {/* New Subjects Section */}
              <StyledPaper elevation={1} sx={{ flex: 1 }}>
                <StyledSectionTitle variant="h6">
                  {t('newSubjectsTab')}
                </StyledSectionTitle>
                
                {safeNewSubjects.length === 0 ? (
                  <EmptyState>
                    <Typography variant="body2" color="textSecondary">
                      {t('noNewSubjectsExtended')}
                    </Typography>
                  </EmptyState>
                ) : (
                  <SubjectsContainer>
                    {safeNewSubjects.map((subject, index) => (
                      <StyledChip
                        key={index}
                        label={subject.name}
                        variant={isSubjectSelected(subject) ? "outlined" : "filled"}
                        color={isSubjectSelected(subject) ? "primary" : "default"}
                        onClick={() => handleToggleSubject(subject)}
                        onDelete={() => handleRemoveSubject(subject)}
                        deleteIcon={<CloseIcon fontSize="small" />}
                        size="small"
                        isRTL={isRTL}
                        sx={{ height: 'auto' }}
                      />
                    ))}
                  </SubjectsContainer>
                )}
              </StyledPaper>
              
              {/* Vertical Divider for larger screens */}
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              
              {/* Horizontal Divider for mobile */}
              <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
              
              {/* Existing Subjects Section */}
              <StyledPaper elevation={1} sx={{ flex: 1 }}>
                <StyledSectionTitle variant="h6">
                  {t('existingSubjectsTab')}
                </StyledSectionTitle>
                
                {existingSubjects.length === 0 ? (
                  <EmptyState>
                    <Typography variant="body2" color="textSecondary">
                      {t('noExistingSubjects')}
                    </Typography>
                  </EmptyState>
                ) : (
                  <SubjectsContainer>
                    {existingSubjects.map((subject) => (
                      <StyledChip
                        key={subject.id}
                        label={subject.name}
                        variant="outlined"
                        size="small"
                        isRTL={isRTL}
                        sx={{ height: 'auto' }}
                      />
                    ))}
                  </SubjectsContainer>
                )}
              </StyledPaper>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
              <Button 
                onClick={handleClose} 
                color="inherit" 
                sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0 }}
                disabled={loading}
              >
                {commonT('cancel')}
              </Button>
              <Button 
                onClick={handleSave} 
                variant="contained" 
                color="primary"
                disabled={loading || selectedSubjects.length === 0}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              >
                {loading ? t('saving') : t('saveSelected')}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubjectReviewDialog; 