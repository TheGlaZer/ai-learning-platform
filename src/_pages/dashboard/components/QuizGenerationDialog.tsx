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
  SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import { FileMetadata } from '@/app/models/file';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { Subject } from '@/app/models/subject';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';
import { useUserLocale } from '@/hooks/useLocale';
import { useSubjectManagement } from '@/hooks/useSubjectManagement';

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
  // Get user locale from URL
  const userLocale = useUserLocale();
  
  // Add debug logging for the locale
  useEffect(() => {
    console.log('QuizGenerationDialog - Current user locale:', userLocale);
  }, [userLocale]);
  
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  // Form state
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [userComments, setUserComments] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [focusSubjectIds, setFocusSubjectIds] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectSelectionMode, setSubjectSelectionMode] = useState<'all' | 'specific'>('all');
  const { fetchWorkspaceSubjects } = useSubjectManagement(userId);
  
  // Use a ref to prevent infinite loops
  const initializedRef = useRef(false);
  
  // Load subjects when the dialog opens
  useEffect(() => {
    if (open && workspaceId) {
      setLoading(true);
      const loadSubjects = async () => {
        try {
          const workspaceSubjects = await fetchWorkspaceSubjects(workspaceId);
          const fetchedSubjects = workspaceSubjects.length > 0 ? workspaceSubjects : subjects;
          setAvailableSubjects(fetchedSubjects);
          setLoading(false);
        } catch (error) {
          console.error('Failed to load subjects:', error);
          setAvailableSubjects(subjects);
          setLoading(false);
        }
      };
      
      loadSubjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspaceId, subjects]); // only re-run when dialog opens, workspace changes, or prop subjects change
  
  // Handle initial selection of all subjects when subjects are loaded
  useEffect(() => {
    if (subjectSelectionMode === 'all' && availableSubjects.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      const allSubjectIds = availableSubjects
        .map(s => s.id)
        .filter((id): id is string => id !== undefined);
      setSelectedSubjectIds(allSubjectIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSubjects.length, subjectSelectionMode]);
  
  // Form validation
  const [formErrors, setFormErrors] = useState<{
    fileId?: string;
    topic?: string;
    numberOfQuestions?: string;
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

  const handleClose = () => {
    if (!isGenerating) {
      resetState();
      setSelectedFileId('');
      setTopic('');
      setNumberOfQuestions(5);
      setDifficultyLevel('medium');
      setUserComments('');
      setSelectedSubjectIds([]);
      setFocusSubjectIds([]);
      setFormErrors({});
      setSubjectSelectionMode('all');
      initializedRef.current = false;
      onClose();
    }
  };

  const handleSubjectSelectionModeChange = (event: SelectChangeEvent<string>) => {
    const mode = event.target.value as 'all' | 'specific';
    setSubjectSelectionMode(mode);
    
    // If switching to 'all', select all subjects - do this only in the handler, not in a useEffect
    if (mode === 'all' && availableSubjects.length > 0) {
      const allSubjectIds = availableSubjects
        .map(s => s.id)
        .filter((id): id is string => id !== undefined);
      setSelectedSubjectIds(allSubjectIds);
    } else if (mode === 'specific') {
      // If switching to 'specific', clear the selection
      setSelectedSubjectIds([]);
      setFocusSubjectIds([]);
    }
  };

  const handleSelectedSubjectsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedSubjectIds(typeof value === 'string' ? value.split(',') : value);

    // Reset focus subjects if they're no longer in the selected subjects
    setFocusSubjectIds(prev => 
      prev.filter(id => 
        (typeof value === 'string' ? value.split(',') : value).includes(id)
      )
    );
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
    setFocusSubjectIds(prev => prev.filter(id => id !== subjectId));
  };
  
  const handleRemoveFocusSubject = (subjectId: string) => {
    setFocusSubjectIds(prev => prev.filter(id => id !== subjectId));
  };

  const handleFocusSubjectsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFocusSubjectIds(typeof value === 'string' ? value.split(',') : value);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!selectedFileId) {
      errors.fileId = 'Please select a file';
    }
    
    if (!topic.trim()) {
      errors.topic = 'Please enter a topic';
    }
    
    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      errors.numberOfQuestions = 'Number of questions must be between 1 and 20';
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
      selectedSubjects: focusSubjectIds.length > 0 ? focusSubjectIds : selectedSubjectIds
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

  const selectedFile = files.find(file => file.id === selectedFileId);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Generate Quiz with AI</Typography>
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
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <AutoAwesomeIcon color="success" sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" color="success.main" gutterBottom>
              Quiz Generated Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your quiz "{generatedQuiz?.title || 'Untitled'}" with {generatedQuiz?.questions?.length || 0} questions has been created.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                1. Select a file to generate questions from
              </Typography>
              <FormControl fullWidth error={!!formErrors.fileId} sx={{ mb: 3 }}>
                <InputLabel id="file-select-label">File</InputLabel>
                <Select
                  labelId="file-select-label"
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  disabled={isGenerating}
                  label="File"
                >
                  {files.map((file) => (
                    <MenuItem key={file.id} value={file.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        {file.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.fileId && <FormHelperText>{formErrors.fileId}</FormHelperText>}
              </FormControl>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                2. Enter a topic for the quiz
              </Typography>
              <TextField
                label="Topic"
                fullWidth
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                error={!!formErrors.topic}
                helperText={formErrors.topic}
                placeholder="e.g., Data Structures, World War II, Cognitive Psychology"
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                3. Configure quiz options
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Number of Questions"
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
                    <InputLabel id="difficulty-select-label">Difficulty</InputLabel>
                    <Select
                      labelId="difficulty-select-label"
                      value={difficultyLevel}
                      onChange={(e) => setDifficultyLevel(e.target.value as any)}
                      disabled={isGenerating}
                      label="Difficulty"
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                      <MenuItem value="expert">Expert</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                4. Additional instructions 
                <Tooltip title="Your instructions will be given high priority in the quiz generation process">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <TextField
                label="Add your own comments/instructions (high priority)"
                fullWidth
                multiline
                rows={4}
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                disabled={isGenerating}
                placeholder="e.g., 'Focus on theoretical concepts', 'Include at least 2 coding questions', 'Make questions about specific sections...'"
                sx={{ mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                5. Select subjects
                <Tooltip title="Select which subjects to include and focus on in the quiz">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              
              {/* Subject selection mode */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="subject-mode-select-label">Subject Selection Mode</InputLabel>
                <Select
                  labelId="subject-mode-select-label"
                  value={subjectSelectionMode}
                  onChange={handleSubjectSelectionModeChange}
                  disabled={isGenerating || availableSubjects.length === 0}
                  label="Subject Selection Mode"
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  <MenuItem value="specific">Specific Subjects</MenuItem>
                </Select>
                <FormHelperText>
                  Choose whether to include all subjects or select specific ones
                </FormHelperText>
              </FormControl>
              
              {/* Subjects to include - only shown in specific mode */}
              {subjectSelectionMode === 'specific' && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="subjects-select-label">Subjects to Include</InputLabel>
                  <Select
                    labelId="subjects-select-label"
                    multiple
                    value={selectedSubjectIds}
                    onChange={handleSelectedSubjectsChange}
                    input={<OutlinedInput label="Subjects to Include" />}
                    disabled={isGenerating || availableSubjects.length === 0 || loading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                          const subject = availableSubjects.find(s => s.id === id);
                          return subject ? (
                            <Chip 
                              key={id} 
                              label={subject.name} 
                              size="small"
                              onDelete={() => handleRemoveSubject(id)}
                              onMouseDown={(event) => event.stopPropagation()}
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    {availableSubjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select subjects to include in the quiz
                  </FormHelperText>
                </FormControl>
              )}
              
              {/* Display selected subjects in 'all' mode */}
              {subjectSelectionMode === 'all' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    All subjects will be included in the quiz
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: '150px', overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {availableSubjects.map((subject) => (
                        <Chip 
                          key={subject.id} 
                          label={subject.name} 
                          size="small"
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}
              
              {/* Subjects to focus on */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="focus-subjects-select-label">Subjects to Focus On (High Priority)</InputLabel>
                <Select
                  labelId="focus-subjects-select-label"
                  multiple
                  value={focusSubjectIds}
                  onChange={handleFocusSubjectsChange}
                  input={<OutlinedInput label="Subjects to Focus On (High Priority)" />}
                  disabled={isGenerating || selectedSubjectIds.length === 0 || loading}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const subject = availableSubjects.find(s => s.id === id);
                        return subject ? (
                          <Chip 
                            key={id} 
                            label={subject.name} 
                            size="small" 
                            color="primary"
                            onDelete={() => handleRemoveFocusSubject(id)}
                            onMouseDown={(event) => event.stopPropagation()}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {subjectSelectionMode === 'all' 
                    ? availableSubjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </MenuItem>
                      ))
                    : selectedSubjectIds.map((id) => {
                        const subject = availableSubjects.find(s => s.id === id);
                        return subject ? (
                          <MenuItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </MenuItem>
                        ) : null;
                      })
                  }
                </Select>
                <FormHelperText>
                  Select subjects to prioritize in the quiz
                </FormHelperText>
              </FormControl>

              {availableSubjects.length === 0 && (
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No subjects available. Create subjects in your workspace first.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
        
        {isGenerating && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress variant="determinate" value={generationProgress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Generating your quiz... {Math.round(generationProgress)}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isGenerating}>
          Cancel
        </Button>
        {!generatedQuiz && (
          <Button 
            onClick={handleGenerateQuiz} 
            variant="contained" 
            color="primary"
            disabled={isGenerating}
            startIcon={<AutoAwesomeIcon />}
          >
            Generate Quiz
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizGenerationDialog;