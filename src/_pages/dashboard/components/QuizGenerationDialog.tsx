"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  LinearProgress,
  Alert,
  IconButton,
  Divider,
  Grid,
  Paper,
  Chip,
  Tooltip,
  OutlinedInput,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import TagIcon from '@mui/icons-material/Tag';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import RefreshIcon from '@mui/icons-material/Refresh';
import styled from '@emotion/styled';
import { FileMetadata } from '@/app/models/file';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { Subject } from '@/app/models/subject';
import { PastExam } from '@/app/models/pastExam';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';
import { useUserLocale } from '@/hooks/useLocale';
import { useSubjects } from '@/app/lib-client/hooks/useSubjects';
import { usePastExams } from '@/hooks/usePastExams';
import { useTranslations } from 'next-intl';
import * as colors from '../../../../colors';



// Styled components with improved theming
const SubjectContainer = styled(Paper)`
  padding: 1.5rem;
  border-radius: 12px;
  background-color: ${colors.background.lighter};
  border: 1px solid ${colors.border.light};
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 80px;
  box-shadow: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: auto;
  max-height: 320px;
  
  &:hover {
    border-color: ${colors.primary.main};
    background-color: ${colors.background.lightest};
  }
`;

// Define the prop type for the styled component
interface SubjectChipProps {
  $priority: 'normal' | 'high';
}

const SubjectChip = styled(Chip)<SubjectChipProps>`
  border-radius: 16px;
  padding: 0 4px;
  height: 36px;
  font-weight: 500;
  transition: all 0.2s ease;
  background-color: ${props => props.$priority === 'high' ? colors.primary.main : colors.background.white};
  color: ${props => props.$priority === 'high' ? colors.text.white : colors.text.primary};
  border: 1px solid ${props => props.$priority === 'high' ? colors.primary.dark : colors.border.medium};
  box-shadow: ${props => props.$priority === 'high' ? `0 2px 8px ${colors.primary.transparent}` : 'none'};
  
  &:hover {
    background-color: ${props => props.$priority === 'high' ? colors.primary.light : colors.background.hover};
  }
  
  & .MuiChip-icon {
    color: ${props => props.$priority === 'high' ? colors.text.white : colors.primary.main};
    margin-left: 8px;
  }
  
  & .MuiChip-deleteIcon {
    color: ${props => props.$priority === 'high' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.3)'};
    margin-right: 5px;
    
    &:hover {
      color: ${props => props.$priority === 'high' ? colors.text.white : colors.text.secondary};
    }
  }
`;

const EmptySubjectsMessage = styled(Typography)`
  width: 100%;
  text-align: center;
  color: ${colors.text.secondary};
  margin-top: 2rem;
`;

const SubjectHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const SubjectHeaderTitle = styled(Box)`
  display: flex;
  align-items: center;
`;

// Styled component for the file upload area
const FileUploadBox = styled(Box)`
  padding: 1.5rem;
  border: 1px dashed ${colors.border.medium};
  border-radius: 8px;
  text-align: center;
  background-color: ${colors.background.lighter};
  margin-top: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${colors.primary.main};
    background-color: ${colors.background.lightest};
  }
`;

const SectionTitle = styled(Typography)`
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SectionNumber = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${colors.primary.main};
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  margin-right: 0.5rem;
`;

interface QuizGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  files: FileMetadata[];
  userId: string;
  onQuizGenerated: (quiz: Quiz) => void;
  subjects?: Subject[];
}

const QuizGenerationDialog: React.FC<QuizGenerationDialogProps> = ({
  open,
  onClose,
  workspaceId,
  files,
  userId,
  onQuizGenerated,
  subjects = []
}) => {
  // Get user locale from URL and translation function
  const userLocale = useUserLocale();
  const t = useTranslations('QuizGeneration');
  
  // Use the subjects hook to get subjects from context
  const { subjects: workspaceSubjects, isLoading: subjectsLoading } = useSubjects(workspaceId);
  
  // Use the past exams hook to get past exams
  const { workspacePastExams, loading: pastExamsLoading, fetchPastExams } = usePastExams(userId);
  
  // Form state
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [userComments, setUserComments] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [highPrioritySubjectIds, setHighPrioritySubjectIds] = useState<string[]>([]);
  
  // Past exam related state
  const [includePastExam, setIncludePastExam] = useState<boolean>(false);
  const [selectedPastExamId, setSelectedPastExamId] = useState<string>('');
  
  // Form validation
  const [formErrors, setFormErrors] = useState<{
    fileId?: string;
    topic?: string;
    numberOfQuestions?: string;
    pastExam?: string;
  }>({});

  // Quiz generation hook
  const { 
    isGenerating, 
    error, 
    generatedQuiz, 
    generationProgress, 
    generateQuiz, 
    resetState 
  } = useQuizGeneration(userId);

  // Store all available subjects
  const [allSubjectIds, setAllSubjectIds] = useState<string[]>([]);

  // Update selected subjects when workspace subjects change
  useEffect(() => {
    if (workspaceSubjects.length > 0) {
      const ids = workspaceSubjects
        .map(s => s.id)
        .filter((id): id is string => id !== undefined);
      setAllSubjectIds(ids);
      setSelectedSubjectIds(ids);
    }
  }, [workspaceSubjects]);
  
  // Fetch past exams when dialog opens
  useEffect(() => {
    if (open && workspaceId) {
      fetchPastExams(workspaceId);
    }
  }, [open, workspaceId, fetchPastExams]);

  const handleClose = () => {
    if (!isGenerating) {
      resetState();
      setSelectedFileId('');
      setTopic('');
      setNumberOfQuestions(5);
      setDifficultyLevel('medium');
      setUserComments('');
      setSelectedSubjectIds([]);
      setHighPrioritySubjectIds([]);
      setFormErrors({});
      setIncludePastExam(false);
      setSelectedPastExamId('');
      onClose();
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    // Toggle high priority status
    if (highPrioritySubjectIds.includes(subjectId)) {
      setHighPrioritySubjectIds(prev => prev.filter(id => id !== subjectId));
    } else {
      setHighPrioritySubjectIds(prev => [...prev, subjectId]);
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
    setHighPrioritySubjectIds(prev => prev.filter(id => id !== subjectId));
  };

  const handlePastExamChange = (e: SelectChangeEvent<string>) => {
    setSelectedPastExamId(e.target.value);
  };

  const handleRefreshSubjects = () => {
    setSelectedSubjectIds([...allSubjectIds]);
    setHighPrioritySubjectIds([]);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!selectedFileId) {
      errors.fileId = t('fileRequired');
    }
    
    if (!topic.trim()) {
      errors.topic = t('topicRequired');
    }
    
    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      errors.numberOfQuestions = t('questionCountError');
    }
    
    if (includePastExam && !selectedPastExamId) {
      errors.pastExam = t('pastExamRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerateQuiz = async () => {
    if (!validateForm()) return;
    
    console.log('Generating quiz with locale:', userLocale);
    
    const params: Omit<QuizGenerationParams, 'userId'> = {
      fileId: selectedFileId,
      topic,
      numberOfQuestions,
      difficultyLevel,
      workspaceId,
      locale: userLocale,
      userComments,
      selectedSubjects: highPrioritySubjectIds.length > 0 ? highPrioritySubjectIds : selectedSubjectIds,
      includePastExam: includePastExam && !!selectedPastExamId,
      pastExamId: includePastExam ? selectedPastExamId : undefined
    };
    
    console.log('Quiz generation params:', params);
    
    const quiz = await generateQuiz(params);
    
    if (quiz) {
      onQuizGenerated(quiz);
      // Close the dialog after a short delay to show the success state
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  // Get available subjects from context or props 
  const availableSubjects = workspaceSubjects.length > 0 ? workspaceSubjects : subjects;
  
  // Get past exams for the current workspace
  const pastExams = workspacePastExams[workspaceId] || [];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuizIcon sx={{ mr: 1.5, color: colors.primary.main, fontSize: 28 }} />
          <Typography variant="h5" fontWeight="600">{t('dialogTitle')}</Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isGenerating}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {generatedQuiz ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <AutoAwesomeIcon color="success" sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" color="success.main" fontWeight="600" gutterBottom>
              {t('quizGeneratedSuccess')}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t('quizGeneratedMessage', { title: generatedQuiz?.title || t('untitled'), count: generatedQuiz?.questions?.length || 0 })}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SectionTitle>
                <SectionNumber>1</SectionNumber>
                {t('selectFile')}
              </SectionTitle>
              <FormControl fullWidth error={!!formErrors.fileId} sx={{ mb: 4 }}>
                <InputLabel id="file-select-label">{t('file')}</InputLabel>
                <Select
                  labelId="file-select-label"
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  disabled={isGenerating}
                  label={t('file')}
                >
                  {files.map((file) => (
                    <MenuItem key={file.id} value={file.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1, color: colors.text.secondary }} />
                        {file.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.fileId && <FormHelperText>{formErrors.fileId}</FormHelperText>}
              </FormControl>
              
              <SectionTitle>
                <SectionNumber>2</SectionNumber>
                {t('enterTopic')}
              </SectionTitle>
              <TextField
                label={t('topic')}
                fullWidth
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                error={!!formErrors.topic}
                helperText={formErrors.topic}
                placeholder={t('topicPlaceholder')}
                sx={{ mb: 4 }}
              />
              
              <SectionTitle>
                <SectionNumber>3</SectionNumber>
                {t('configureOptions')}
              </SectionTitle>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <TextField
                    label={t('questionCount')}
                    type="number"
                    fullWidth
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                    disabled={isGenerating}
                    error={!!formErrors.numberOfQuestions}
                    helperText={formErrors.numberOfQuestions}
                    InputProps={{ inputProps: { min: 1, max: 20 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel id="difficulty-select-label">{t('difficulty')}</InputLabel>
                    <Select
                      labelId="difficulty-select-label"
                      value={difficultyLevel}
                      onChange={(e) => setDifficultyLevel(e.target.value as any)}
                      disabled={isGenerating}
                      label={t('difficulty')}
                    >
                      <MenuItem value="easy">{t('difficultyEasy')}</MenuItem>
                      <MenuItem value="medium">{t('difficultyMedium')}</MenuItem>
                      <MenuItem value="hard">{t('difficultyHard')}</MenuItem>
                      <MenuItem value="expert">{t('difficultyExpert')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <SectionTitle sx={{ display: 'flex', alignItems: 'center' }}>
                <SectionNumber>4</SectionNumber>
                {t('additionalInstructions')} 
                <Tooltip title={t('additionalInstructionsTooltip')}>
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SectionTitle>
              <TextField
                label={t('instructionsLabel')}
                fullWidth
                multiline
                rows={4}
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                disabled={isGenerating}
                placeholder={t('instructionsPlaceholder')}
                sx={{ mb: 4 }}
              />
              
              <SectionTitle sx={{ display: 'flex', alignItems: 'center' }}>
                <SectionNumber>5</SectionNumber>
                {t('pastExamReference')}
                <Tooltip title={t('pastExamTooltip')}>
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SectionTitle>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={includePastExam}
                    onChange={(e) => setIncludePastExam(e.target.checked)}
                    disabled={isGenerating}
                  />
                }
                label={t('includePastExam')}
              />
              
              <Collapse in={includePastExam}>
                <FileUploadBox>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="past-exam-label">{t('selectPastExam')}</InputLabel>
                    <Select
                      labelId="past-exam-label"
                      id="past-exam-select"
                      value={selectedPastExamId}
                      onChange={handlePastExamChange}
                      label={t('selectPastExam')}
                      disabled={isGenerating || pastExamsLoading}
                      startAdornment={selectedPastExamId ? <HistoryEduIcon sx={{ ml: 1, mr: 0.5, color: colors.text.secondary }} /> : null}
                    >
                      <MenuItem value="">
                        <em>{t('selectExamPrompt')}</em>
                      </MenuItem>
                      {pastExams.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HistoryEduIcon sx={{ mr: 1, color: colors.text.secondary }} />
                            {exam.name} {exam.year ? `(${exam.year}` : ''}{exam.semester ? ` ${exam.semester})` : exam.year ? ')' : ''}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {pastExamsLoading && (
                    <LinearProgress sx={{ mt: 2 }} />
                  )}
                  
                  {!pastExamsLoading && pastExams.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {t('noPastExams')}
                    </Alert>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('pastExamDescription')}
                  </Typography>
                </FileUploadBox>
                {formErrors.pastExam && (
                  <FormHelperText error>{formErrors.pastExam}</FormHelperText>
                )}
              </Collapse>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <SubjectHeader>
                <SubjectHeaderTitle>
                  <SectionNumber>6</SectionNumber>
                  <Typography variant="subtitle1" fontWeight="600">
                    {t('selectSubjects')}
                  </Typography>
                  <Tooltip title={t('subjectsTooltip')}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </SubjectHeaderTitle>
                <Tooltip title={t('refreshSubjects')}>
                  <IconButton 
                    onClick={handleRefreshSubjects} 
                    disabled={isGenerating}
                    color="primary"
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </SubjectHeader>
              
              {subjectsLoading ? (
                <LinearProgress />
              ) : (
                <SubjectContainer>
                  {availableSubjects.length > 0 ? (
                    selectedSubjectIds.map((subjectId) => {
                      const subject = availableSubjects.find(s => s.id === subjectId);
                      const isPriority = highPrioritySubjectIds.includes(subjectId);
                      
                      return subject ? (
                        <SubjectChip
                          key={subjectId}
                          $priority={isPriority ? 'high' : 'normal'}
                          label={subject.name}
                          onClick={() => handleSubjectClick(subjectId)}
                          onDelete={() => handleRemoveSubject(subjectId)}
                          icon={<TagIcon />}
                          disabled={isGenerating}
                        />
                      ) : null;
                    })
                  ) : (
                    <EmptySubjectsMessage>
                      {t('noSubjects')}
                    </EmptySubjectsMessage>
                  )}
                </SubjectContainer>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {t('subjectsClickInstructions')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
        
        {isGenerating && (
          <Box sx={{ mt: 4 }}>
            <LinearProgress variant="determinate" value={generationProgress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {t('generatingProgress', { progress: Math.round(generationProgress) })}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isGenerating}>
          {t('cancel')}
        </Button>
        {!generatedQuiz && (
          <Button 
            onClick={handleGenerateQuiz} 
            variant="contained" 
            color="primary"
            disabled={isGenerating}
            startIcon={<AutoAwesomeIcon />}
          >
            {t('generateQuiz')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizGenerationDialog;