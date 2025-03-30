"use client";
import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import { FileMetadata } from '@/app/models/file';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';

interface QuizGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  files: FileMetadata[];
  userId: string;
  onQuizGenerated: (quiz: Quiz) => void;
}

const QuizGenerationDialog: React.FC<QuizGenerationDialogProps> = ({
  open,
  onClose,
  workspaceId,
  files,
  userId,
  onQuizGenerated
}) => {
  // Form state
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  
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
      setFormErrors({});
      onClose();
    }
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
    
    const params: Omit<QuizGenerationParams, 'userId'> = {
      fileId: selectedFileId,
      topic,
      numberOfQuestions,
      difficultyLevel,
      workspaceId,
    };
    
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
              Your quiz "{generatedQuiz.title}" with {generatedQuiz.questions.length} questions has been created.
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                
                {selectedFile ? (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Selected File:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>{selectedFile.name}</Typography>
                    </Box>
                    
                    {topic && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Topic:
                        </Typography>
                        <Chip
                          label={topic}
                          color="primary"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      </>
                    )}
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Configuration:
                    </Typography>
                    <Typography variant="body2">
                      {numberOfQuestions} {numberOfQuestions === 1 ? 'question' : 'questions'} • {difficultyLevel} difficulty
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', color: 'text.secondary' }}>
                    <Typography variant="body2">
                      Select a file and configure your quiz options
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {isGenerating && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Generating your quiz... This may take a minute.
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={generationProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
              {Math.round(generationProgress)}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleGenerateQuiz}
          disabled={isGenerating || !!generatedQuiz}
          startIcon={isGenerating ? null : <AutoAwesomeIcon />}
        >
          {isGenerating ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizGenerationDialog;