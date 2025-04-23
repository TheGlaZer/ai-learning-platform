"use client";
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  LinearProgress,
  Alert,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import { FileMetadata } from '@/app/models/file';
import { Subject, SubjectGenerationParams } from '@/app/models/subject';
import { useSubjectManagement } from '@/hooks/useSubjectManagement';
import { useUserLocale } from '@/hooks/useLocale';
import { useTranslations } from 'next-intl';
import SubjectReviewDialog from './SubjectReviewDialog';

const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
`;

const StyledCloseButton = styled(IconButton)`
  margin-left: auto;
`;

const StyledAlert = styled(Alert)`
  margin-bottom: 16px;
`;

const StyledLinearProgress = styled(LinearProgress)`
  margin: 16px 0;
  height: 10px;
  border-radius: 5px;
  background-color: #e0e0e0;
  
  .MuiLinearProgress-bar {
    background-color: #1976d2;
  }
`;

// Progress indicator wrapper
const ProgressContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
`;

const ProgressStatusText = styled(Typography)`
  margin-top: 16px;
  color: #666;
  font-style: italic;
`;

const StyledFileIcon = styled(DescriptionIcon)`
  margin-right: 8px;
  color: #1976d2;
`;

interface SubjectGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  files: FileMetadata[];
  userId: string;
  onSubjectsGenerated: (subjects: Subject[]) => void;
}

const SubjectGenerationDialog: React.FC<SubjectGenerationDialogProps> = ({ 
  open, 
  onClose, 
  workspaceId, 
  files, 
  userId,
  onSubjectsGenerated
}) => {
  // Get user locale from URL
  const userLocale = useUserLocale();
  const t = useTranslations('SubjectGeneration');
  const commonT = useTranslations('Common');
  
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [countRange, setCountRange] = useState<'small' | 'medium' | 'large'>('medium');
  const [specificity, setSpecificity] = useState<'general' | 'specific'>('general');
  
  const { 
    generateSubjects, 
    generatedNewSubjects, 
    generatedExistingSubjects, 
    generating, 
    error,
    clearGeneratedSubjects,
    resetState,
    fetchWorkspaceSubjects,
    workspaceSubjects,
    unrelatedContentMessage,
    saveGeneratedSubjects,
    loading,
    updateSelectedNewSubjects
  } = useSubjectManagement(userId);

  // Add state for progress percentage
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Update progress percentage when generating
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (generating) {
      setProgressPercentage(0);
      intervalId = setInterval(() => {
        setProgressPercentage(prev => {
          // Slowly increase to 90% max during generation
          if (prev < 90) {
            return prev + Math.floor(Math.random() * 3) + 1;
          }
          return prev;
        });
      }, 1000);
    } else if (progressPercentage > 0 && progressPercentage < 100) {
      // Complete to 100% when generation is done
      setProgressPercentage(100);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generating, progressPercentage]);

  const handleFileChange = (event: SelectChangeEvent) => {
    setSelectedFileId(event.target.value);
    setErrorMsg(null);
  };

  const handleCountRangeChange = (event: SelectChangeEvent<string>) => {
    setCountRange(event.target.value as 'small' | 'medium' | 'large');
  };
  
  const handleSpecificityChange = (event: SelectChangeEvent<string>) => {
    setSpecificity(event.target.value as 'general' | 'specific');
  };

  const handleGenerateSubjects = async () => {
    if (!selectedFileId) {
      setErrorMsg('Please select a file to generate subjects from.');
      return;
    }

    try {
      setErrorMsg(null);
      
      const params: SubjectGenerationParams = {
        workspaceId,
        fileId: selectedFileId,
        userId,
        locale: userLocale,
        countRange,
        specificity
      };
      
      // If we don't have any subjects for this workspace yet, fetch them first
      if (!workspaceSubjects[workspaceId]) {
        await fetchWorkspaceSubjects(workspaceId);
      }
      
      const subjects = await generateSubjects(params);
      
      if (unrelatedContentMessage) {
        setErrorMsg(t('unrelatedContent', { message: unrelatedContentMessage }));
      } else if (subjects.length === 0) {
        setErrorMsg('No new subjects could be generated from this file. Try another file or create subjects manually.');
      } else {
        // Open the review dialog to let the user select which subjects to save
        setShowReviewDialog(true);
      }
      
      if (onSubjectsGenerated) {
        onSubjectsGenerated(subjects);
      }
    } catch (err) {
      console.error('Failed to generate subjects:', err);
      setErrorMsg('An error occurred during subject generation. Please try again.');
    }
  };

  const handleSaveSelected = async (subjects: Subject[]) => {
    if (!subjects || subjects.length === 0) {
      // If no subjects to save, just close the dialog
      setShowReviewDialog(false);
      return;
    }
    
    try {
      // First update the generatedNewSubjects with the selected ones
      if (updateSelectedNewSubjects) {
        updateSelectedNewSubjects(subjects);
      }
      
      // Now save them to the database
      const savedSubjects = await saveGeneratedSubjects();
      
      // Notify parent component of the saved subjects
      if (onSubjectsGenerated && savedSubjects.length > 0) {
        onSubjectsGenerated(savedSubjects);
      }
      
      // Close the dialogs
      setShowReviewDialog(false);
      handleClose();
    } catch (err) {
      console.error('Failed to save selected subjects:', err);
      setErrorMsg(t('saveError'));
    }
  };

  const handleClose = () => {
    if (!generating) {
      resetState();
      setSelectedFileId('');
      setErrorMsg(null);
      clearGeneratedSubjects();
      onClose();
    }
  };

  const handleCloseReviewDialog = () => {
    setShowReviewDialog(false);
    
    // Clear the selected new subjects to prevent automatic saving
    if (updateSelectedNewSubjects) {
      // Clear the selection by passing an empty array
      updateSelectedNewSubjects([]);
    }
    
    // Make it explicit that the user can return to the generation dialog
    // instead of closing completely without saving
    console.log('Returning to subject generation dialog without saving');
    
    // We don't call handleClose() here to keep the main dialog open
  };

  return (
    <>
      <Dialog open={open && !showReviewDialog} onClose={handleClose} maxWidth="md" fullWidth>
        <StyledDialogTitle>
          {t('dialogTitle')}
          <StyledCloseButton onClick={handleClose}>
            <CloseIcon />
          </StyledCloseButton>
        </StyledDialogTitle>
        
        <DialogContent>
          {generating ? (
            <ProgressContainer>
              <Typography variant="h6" gutterBottom>
                {t('analyzingContent')}
              </Typography>
              <Box sx={{ width: '100%', my: 3, position: 'relative' }}>
                <StyledLinearProgress variant="determinate" value={progressPercentage} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    position: 'absolute', 
                    top: '-6px', 
                    right: '0', 
                    fontWeight: 'bold',
                    color: '#1976d2',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '0 4px',
                    borderRadius: '4px'
                  }}
                >
                  {progressPercentage}%
                </Typography>
              </Box>
              <ProgressStatusText variant="body2">
                {t('generatingProgress')}
              </ProgressStatusText>
              <Typography variant="caption" sx={{ mt: 2 }}>
                {t('thisWillTakeTime')}
              </Typography>
            </ProgressContainer>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('selectFileTitle')}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                {t('selectFileDescription')}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="file-select-label">{t('selectFile')}</InputLabel>
                <Select
                  labelId="file-select-label"
                  value={selectedFileId}
                  onChange={handleFileChange}
                  label={t('selectFile')}
                  fullWidth
                >
                  {files.map((file) => (
                    <MenuItem key={file.id} value={file.id}>
                      <StyledFileIcon fontSize="small" />
                      {file.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Subject Count Range Selection */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="count-range-label">{t('countRangeLabel')}</InputLabel>
                <Select
                  labelId="count-range-label"
                  value={countRange}
                  onChange={handleCountRangeChange}
                  label={t('countRangeLabel')}
                  fullWidth
                >
                  <MenuItem value="small">{t('countRangeSmall')}</MenuItem>
                  <MenuItem value="medium">{t('countRangeMedium')}</MenuItem>
                  <MenuItem value="large">{t('countRangeLarge')}</MenuItem>
                </Select>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                  {t('countRangeDescription')}
                </Typography>
              </FormControl>
              
              {/* Subject Specificity Selection */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="specificity-label">{t('specificityLabel')}</InputLabel>
                <Select
                  labelId="specificity-label"
                  value={specificity}
                  onChange={handleSpecificityChange}
                  label={t('specificityLabel')}
                  fullWidth
                >
                  <MenuItem value="general">{t('specificityGeneral')}</MenuItem>
                  <MenuItem value="specific">{t('specificitySpecific')}</MenuItem>
                </Select>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                  {t('specificityDescription')}
                </Typography>
              </FormControl>
              
              {errorMsg && (
                <StyledAlert severity="error" onClose={() => setErrorMsg(null)}>
                  {errorMsg}
                </StyledAlert>
              )}

              {error && (
                <StyledAlert severity="error">
                  {error}
                </StyledAlert>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={handleClose} 
                  color="inherit" 
                  sx={{ mr: 1 }}
                >
                  {commonT('cancel')}
                </Button>
                <Button 
                  onClick={handleGenerateSubjects} 
                  variant="contained" 
                  color="primary"
                  disabled={!selectedFileId || generating}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ 
                    fontWeight: 'bold', 
                    py: 1, 
                    px: 3,
                    boxShadow: 3,
                    '&:hover': { 
                      boxShadow: 5,
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.3s, box-shadow 0.3s'
                    }
                  }}
                >
                  {t('generateSubjects')}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Subject Review Dialog - Now the only way to review subjects */}
      {showReviewDialog && (generatedNewSubjects || generatedExistingSubjects) && (
        <SubjectReviewDialog
          open={showReviewDialog}
          onClose={handleCloseReviewDialog}
          workspaceId={workspaceId}
          userId={userId}
          newSubjects={generatedNewSubjects || []}
          existingSubjects={generatedExistingSubjects || []}
          onSaveSubjects={handleSaveSelected}
          updateSelectedSubjects={updateSelectedNewSubjects}
        />
      )}
    </>
  );
};

export default SubjectGenerationDialog; 