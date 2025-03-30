"use client";
import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Tabs, Tab, Divider } from '@mui/material';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import { Quiz } from '@/app/models/quiz';
import FileCard from './FileCard';
import QuizCard from './QuizCard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import QuizIcon from '@mui/icons-material/Quiz';

interface FilesContainerProps {
  selectedWorkspace: Workspace | null;
  files: FileMetadata[];
  quizzes?: Quiz[];
  onDeleteFile: (fileId: string) => void;
  onEditFile: (file: FileMetadata) => void;
  onUploadFile: () => void;
  onGenerateQuiz: () => void;
  onOpenQuiz?: (quiz: Quiz) => void;
}

const FilesContainer: React.FC<FilesContainerProps> = ({
  selectedWorkspace,
  files,
  quizzes = [],
  onDeleteFile,
  onEditFile,
  onUploadFile,
  onGenerateQuiz,
  onOpenQuiz = () => {}
}) => {
  const [tabValue, setTabValue] = useState<number>(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!selectedWorkspace) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Typography variant="h6" color="text.secondary">
          Select a workspace to view files
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{selectedWorkspace.name}</Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={onGenerateQuiz}
            startIcon={<QuizIcon />}
            sx={{ mr: 2 }}
          >
            Generate Quiz
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onUploadFile}
            startIcon={<CloudUploadIcon />}
          >
            Upload File
          </Button>
        </Box>
      </Box>
      
      {selectedWorkspace.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {selectedWorkspace.description}
        </Typography>
      )}
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="Files" />
        <Tab label={`Quizzes (${quizzes.length})`} />
      </Tabs>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Files Tab */}
      {tabValue === 0 && (
        <>
          {files?.length > 0 ? (
            <Grid container spacing={2}>
              {files.map(file => (
                <Grid item xs={12} sm={6} md={4} key={file.id}>
                  <FileCard
                    file={file} 
                    onDelete={() => onDeleteFile(file.id)}
                    onEdit={() => onEditFile(file)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No files in this workspace yet. Click "Upload File" to add files.
            </Typography>
          )}
        </>
      )}
      
      {/* Quizzes Tab */}
      {tabValue === 1 && (
        <>
          {quizzes?.length > 0 ? (
            <Grid container spacing={2}>
              {quizzes.map(quiz => (
                <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                  <QuizCard
                    quiz={quiz}
                    onClick={onOpenQuiz}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No quizzes in this workspace yet.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={onGenerateQuiz}
                startIcon={<QuizIcon />}
                sx={{ mt: 2 }}
              >
                Generate Your First Quiz
              </Button>
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default FilesContainer;