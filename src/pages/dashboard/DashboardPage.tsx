"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid, Paper } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import { Quiz } from '@/app/models/quiz';
import { useWorkspaceManagement } from '@/hooks/useWorkspaceManagement';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';

import WorkspaceList from './components/WorkspaceList';
import FilesContainer from './components/FilesContainer';
import WorkspaceDialog from './components/WorkspaceDialog';
import FileUploadDialog from './components/FileUploadDialog';
import QuizGenerationDialog from './components/QuizGenerationDialog';

const DashboardPage = () => {
  const { userId } = useAuth();
  const { 
    workspaces,
    workspaceFiles,
    selectedWorkspace,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    selectWorkspace,
    addFileToWorkspace,
    removeFileFromWorkspace
  } = useWorkspaceManagement(userId);
  
  const {
    workspaceQuizzes,
    fetchWorkspaceQuizzes,
  } = useQuizGeneration(userId);
  
  // State for dialogs
  const [openWorkspaceDialog, setOpenWorkspaceDialog] = useState(false);
  const [openFileUploadDialog, setOpenFileUploadDialog] = useState(false);
  const [openQuizGenerationDialog, setOpenQuizGenerationDialog] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchWorkspaces(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchWorkspaceQuizzes(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const handleOpenWorkspaceDialog = () => {
    setOpenWorkspaceDialog(true);
  };

  const handleCloseWorkspaceDialog = () => {
    setOpenWorkspaceDialog(false);
  };

  const handleOpenFileUploadDialog = () => {
    setOpenFileUploadDialog(true);
  };

  const handleCloseFileUploadDialog = () => {
    setOpenFileUploadDialog(false);
  };

  const handleOpenQuizGenerationDialog = () => {
    setOpenQuizGenerationDialog(true);
  };

  const handleCloseQuizGenerationDialog = () => {
    setOpenQuizGenerationDialog(false);
  };

  const handleCreateWorkspace = async (name: string, description?: string) => {
    try {
      const result = await createWorkspace(
        name,
        description
      );
      
      return !!result;
    } catch (err) {
      console.error('Error creating workspace:', err);
      return false;
    }
  };

  const handleFileUploaded = (file: FileMetadata) => {
    if (selectedWorkspace) {
      addFileToWorkspace(selectedWorkspace.id, file);
    }
  };

  const handleQuizGenerated = (quiz: Quiz) => {
    console.log('Quiz generated:', quiz);
    // The quiz is automatically added to workspaceQuizzes by the hook
  };

  const handleDeleteFile = (fileId: string) => {
    if (selectedWorkspace) {
      removeFileFromWorkspace(selectedWorkspace.id, fileId);
      // Here you would also call an API to delete the file from the backend
      console.log('Delete file:', fileId);
    }
  };

  const handleEditFile = (file: FileMetadata) => {
    // This will be implemented to handle file editing
    console.log('Edit file:', file);
  };

  const handleOpenQuiz = (quiz: Quiz) => {
    // This will be implemented to open and view a quiz
    console.log('Open quiz:', quiz);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left sidebar with workspaces */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '100%',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto'
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Workspaces
              </Typography>
              <Box 
                component="button"
                sx={{ 
                  background: 'none',
                  border: 'none',
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  p: 0,
                  textTransform: 'uppercase',
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                onClick={handleOpenWorkspaceDialog}
              >
                + New
              </Box>
            </Box>
            <WorkspaceList 
              workspaces={workspaces} 
              workspaceFiles={workspaceFiles}
              selectedWorkspace={selectedWorkspace}
              onWorkspaceSelect={selectWorkspace}
            />
          </Paper>
        </Grid>
        
        {/* Right content area with files */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              minHeight: '400px',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto'
            }}
          >
            <FilesContainer
              selectedWorkspace={selectedWorkspace}
              files={selectedWorkspace ? workspaceFiles[selectedWorkspace.id] || [] : []}
              quizzes={selectedWorkspace ? workspaceQuizzes[selectedWorkspace.id] || [] : []}
              onDeleteFile={handleDeleteFile}
              onEditFile={handleEditFile}
              onUploadFile={handleOpenFileUploadDialog}
              onGenerateQuiz={handleOpenQuizGenerationDialog}
              onOpenQuiz={handleOpenQuiz}
            />
          </Paper>
        </Grid>
      </Grid>
      
      {/* Create Workspace Dialog */}
      <WorkspaceDialog
        open={openWorkspaceDialog}
        onClose={handleCloseWorkspaceDialog}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {/* File Upload Dialog */}
      {selectedWorkspace && (
        <FileUploadDialog
          open={openFileUploadDialog}
          onClose={handleCloseFileUploadDialog}
          workspaceId={selectedWorkspace.id}
          onFileUploaded={handleFileUploaded}
        />
      )}

      {/* Quiz Generation Dialog */}
      {selectedWorkspace && (
        <QuizGenerationDialog
          open={openQuizGenerationDialog}
          onClose={handleCloseQuizGenerationDialog}
          workspaceId={selectedWorkspace.id}
          files={selectedWorkspace ? workspaceFiles[selectedWorkspace.id] || [] : []}
          userId={userId || ''}
          onQuizGenerated={handleQuizGenerated}
        />
      )}
    </Box>
  );
};

export default DashboardPage;