"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid, Paper } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import { Quiz } from '@/app/models/quiz';
import { Subject } from '@/app/models/subject';
import { useQuizGeneration } from '@/hooks/useQuizGeneration';
import { useSubjectManagement } from '@/hooks/useSubjectManagement';
import { deleteFileClient, updateFileMetadata } from "@/app/lib-client/fileClient";

import WorkspaceList from './components/WorkspaceList';
import FilesContainer from './components/FilesContainer';
import WorkspaceDialog from './components/WorkspaceDialog';
import FileUploadDialog from './components/FileUploadDialog';
import QuizGenerationDialog from './components/QuizGenerationDialog';
import SubjectGenerationDialog from './components/SubjectGenerationDialog';
import SubjectEditDialog from './components/SubjectEditDialog';
import FileMetadataDialog from './components/FileMetadataDialog';

const DashboardPage = () => {
  const { userId, accessToken } = useAuth();
  const { 
    workspaces,
    workspaceFiles,
    selectedWorkspace,
    loading: workspacesLoading,
    error: workspacesError,
    createWorkspace,
    selectWorkspace,
    addFileToWorkspace,
    removeFileFromWorkspace
  } = useWorkspace();
  
  const {
    workspaceQuizzes,
    fetchWorkspaceQuizzes,
    deleteQuiz
  } = useQuizGeneration(userId);
  
  const {
    workspaceSubjects,
    generatedSubjects,
    fetchWorkspaceSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    generateSubjects,
  } = useSubjectManagement(userId);
  
  // State for dialogs
  const [openWorkspaceDialog, setOpenWorkspaceDialog] = useState(false);
  const [openFileUploadDialog, setOpenFileUploadDialog] = useState(false);
  const [openQuizGenerationDialog, setOpenQuizGenerationDialog] = useState(false);
  const [openSubjectGenerationDialog, setOpenSubjectGenerationDialog] = useState(false);
  const [openSubjectEditDialog, setOpenSubjectEditDialog] = useState(false);
  
  // State for subject editing
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Add state for file editing
  const [openFileMetadataDialog, setOpenFileMetadataDialog] = useState(false);
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchWorkspaceQuizzes(selectedWorkspace.id);
      fetchWorkspaceSubjects(selectedWorkspace.id);
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
  
  const handleOpenSubjectGenerationDialog = () => {
    setOpenSubjectGenerationDialog(true);
  };
  
  const handleCloseSubjectGenerationDialog = () => {
    setOpenSubjectGenerationDialog(false);
  };
  
  const handleOpenSubjectEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setOpenSubjectEditDialog(true);
  };
  
  const handleCloseSubjectEditDialog = () => {
    setEditingSubject(null);
    setOpenSubjectEditDialog(false);
  };

  const handleCreateWorkspace = async (name: string, description?: string): Promise<boolean> => {
    if (userId) {
      try {
        const workspace = await createWorkspace(name, description);
        handleCloseWorkspaceDialog();
        return !!workspace;
      } catch (error) {
        console.error('Error creating workspace:', error);
        return false;
      }
    }
    return false;
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
  
  const handleSubjectsGenerated = (subjects: Subject[]) => {
    console.log('Subjects generated:', subjects);
    // The subjects are temporarily stored in generatedSubjects by the hook
    // They will be permanently added when user saves them
  };

  const handleDeleteFile = async (fileId: string) => {
    if (selectedWorkspace && accessToken) {
      try {
        // Call the API to delete the file from Supabase
        await deleteFileClient(fileId, accessToken);
        
        // If deletion is successful, update the local state
        removeFileFromWorkspace(selectedWorkspace.id, fileId);
        console.log('File deleted successfully:', fileId);
      } catch (error) {
        console.error('Error deleting file:', error);
        // You might want to show an error notification to the user here
      }
    } else if (!accessToken) {
      console.error('Cannot delete file: User not authenticated');
    }
  };

  const handleOpenFileMetadataDialog = (file: FileMetadata) => {
    setEditingFile(file);
    setOpenFileMetadataDialog(true);
  };
  
  const handleCloseFileMetadataDialog = () => {
    setEditingFile(null);
    setOpenFileMetadataDialog(false);
  };
  
  const handleSaveFileMetadata = async (file: FileMetadata, updates: Partial<FileMetadata>) => {
    if (selectedWorkspace && accessToken) {
      try {
        const success = await updateFileMetadata(file.id, updates, accessToken);
        
        if (success) {
          // Update file in the local state
          const updatedFiles = workspaceFiles[selectedWorkspace.id]?.map(f => 
            f.id === file.id ? { ...f, ...updates } : f
          ) || [];
          
          // This is a workaround to trigger a re-render with the updated file
          const updatedWorkspaceFiles = {
            ...workspaceFiles,
            [selectedWorkspace.id]: updatedFiles
          };
          
          // Manual update of the state since we can't directly modify the hook's state
          Object.assign(workspaceFiles, updatedWorkspaceFiles);
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error saving file metadata:', error);
        return false;
      }
    }
    
    return false;
  };
  
  const handleEditFile = (file: FileMetadata) => {
    handleOpenFileMetadataDialog(file);
  };
  
  const handleEditSubject = (subject: Subject) => {
    handleOpenSubjectEditDialog(subject);
  };
  
  const handleSaveSubjectEdit = async (id: string, updates: Partial<Subject>) => {
    await updateSubject(id, updates);
  };
  
  const handleDeleteSubject = (subject: Subject) => {
    if (subject.id && selectedWorkspace) {
      deleteSubject(subject.id);
      console.log('Delete subject:', subject.id);
    }
  };

  const handleAddSubject = async (subject: Partial<Subject>) => {
    if (selectedWorkspace) {
      try {
        return await createSubject(subject);
      } catch (error) {
        console.error('Error adding subject:', error);
        return null;
      }
    }
    return null;
  };

  const handleOpenQuiz = (quiz: Quiz) => {
    // This will be implemented to open and view a quiz
    console.log('Open quiz:', quiz);
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (selectedWorkspace && quiz.id) {
      try {
        const success = await deleteQuiz(quiz.id, selectedWorkspace.id);
        if (success) {
          console.log('Quiz deleted successfully:', quiz.id);
        } else {
          console.error('Failed to delete quiz:', quiz.id);
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  if (workspacesLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (workspacesError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{workspacesError}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
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
          subjects={selectedWorkspace ? workspaceSubjects[selectedWorkspace.id] || [] : []}
          userId={userId || ''}
          onDeleteFile={handleDeleteFile}
          onEditFile={handleEditFile}
          onUploadFile={handleOpenFileUploadDialog}
          onGenerateQuiz={handleOpenQuizGenerationDialog}
          onGenerateSubjects={handleOpenSubjectGenerationDialog}
          onEditSubject={handleEditSubject}
          onDeleteSubject={handleDeleteSubject}
          onOpenQuiz={handleOpenQuiz}
          onDeleteQuiz={handleDeleteQuiz}
          onAddSubject={handleAddSubject}
        />
      </Paper>
      
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
      
      {/* Subject Generation Dialog */}
      {selectedWorkspace && (
        <SubjectGenerationDialog
          open={openSubjectGenerationDialog}
          onClose={handleCloseSubjectGenerationDialog}
          workspaceId={selectedWorkspace.id}
          files={selectedWorkspace ? workspaceFiles[selectedWorkspace.id] || [] : []}
          userId={userId || ''}
          onSubjectsGenerated={handleSubjectsGenerated}
        />
      )}
      
      {/* Subject Edit Dialog */}
      <SubjectEditDialog
        open={openSubjectEditDialog}
        onClose={handleCloseSubjectEditDialog}
        subject={editingSubject}
        onSave={handleSaveSubjectEdit}
      />

      {/* Add FileMetadataDialog */}
      <FileMetadataDialog
        open={openFileMetadataDialog}
        onClose={handleCloseFileMetadataDialog}
        file={editingFile}
        onSave={handleSaveFileMetadata}
      />
    </Box>
  );
};

export default DashboardPage;