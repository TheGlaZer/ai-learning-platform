"use client";
import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Tabs, Tab, Divider, Fab, Tooltip } from '@mui/material';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import { Quiz } from '@/app/models/quiz';
import { Subject } from '@/app/models/subject';
import FileCard from './FileCard';
import QuizCard from './QuizCard';
import SubjectCard from './SubjectCard';
import SubjectAddDialog from './SubjectAddDialog';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import QuizIcon from '@mui/icons-material/Quiz';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';

interface FilesContainerProps {
  selectedWorkspace: Workspace | null;
  files: FileMetadata[];
  quizzes?: Quiz[];
  subjects?: Subject[];
  userId: string;
  onDeleteFile: (fileId: string) => void;
  onEditFile: (file: FileMetadata) => void;
  onUploadFile: () => void;
  onGenerateQuiz: () => void;
  onGenerateSubjects: () => void;
  onEditSubject?: (subject: Subject) => void;
  onDeleteSubject?: (subject: Subject) => void;
  onAddSubject?: (subject: Partial<Subject>) => Promise<Subject | null>;
  onOpenQuiz?: (quiz: Quiz) => void;
  onDeleteQuiz?: (quiz: Quiz) => void;
}

const FilesContainer: React.FC<FilesContainerProps> = ({
  selectedWorkspace,
  files,
  quizzes = [],
  subjects = [],
  userId,
  onDeleteFile,
  onEditFile,
  onUploadFile,
  onGenerateQuiz,
  onGenerateSubjects,
  onEditSubject,
  onDeleteSubject,
  onAddSubject,
  onOpenQuiz = () => {},
  onDeleteQuiz
}) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState<boolean>(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenSubjectDialog = () => {
    setSubjectDialogOpen(true);
  };

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false);
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
            onClick={onGenerateSubjects}
            startIcon={<CategoryIcon />}
            sx={{ mr: 2 }}
          >
            Generate Subjects
          </Button>
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
        <Tab label={`Files (${files.length})`} />
        <Tab label={`Subjects (${subjects.length})`} />
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
                    onClick={() => onEditFile(file)}
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
      
      {/* Subjects Tab */}
      {tabValue === 1 && (
        <>
          {subjects?.length > 0 ? (
            <Box sx={{ position: 'relative', minHeight: '300px' }}>
              <Grid container spacing={2}>
                {subjects.map(subject => (
                  <Grid item xs={12} sm={6} md={4} key={subject.id}>
                    <SubjectCard
                      subject={subject}
                      onClick={() => {}}
                      onEdit={onEditSubject}
                      onDelete={onDeleteSubject}
                    />
                  </Grid>
                ))}
                {/* Add Subject Card */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box 
                    onClick={handleOpenSubjectDialog}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '2px dashed',
                      borderColor: 'primary.light',
                      borderRadius: '8px',
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <AddIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="primary" align="center">
                      Add New Subject
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No subjects in this workspace yet.
              </Typography>
              <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={onGenerateSubjects}
                  startIcon={<CategoryIcon />}
                >
                  Generate Subjects from Files
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleOpenSubjectDialog}
                  startIcon={<AddIcon />}
                >
                  Add Subject Manually
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
      
      {/* Quizzes Tab */}
      {tabValue === 2 && (
        <>
          {quizzes?.length > 0 ? (
            <Grid container spacing={2}>
              {quizzes.map(quiz => (
                <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                  <QuizCard
                    quiz={quiz}
                    onClick={onOpenQuiz}
                    onDelete={onDeleteQuiz}
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

      {/* Subject Add Dialog */}
      {onAddSubject && selectedWorkspace && (
        <SubjectAddDialog 
          open={subjectDialogOpen}
          onClose={handleCloseSubjectDialog}
          workspaceId={selectedWorkspace.id}
          userId={userId}
          onAdd={onAddSubject}
        />
      )}
    </>
  );
};

export default FilesContainer;