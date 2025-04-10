"use client";
import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
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
  Divider,
  Grid,
  Paper,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  SelectChangeEvent,
  Checkbox
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FileMetadata } from '@/app/models/file';
import { Subject, SubjectGenerationParams } from '@/app/models/subject';
import { useSubjectManagement } from '@/hooks/useSubjectManagement';
import { useUserLocale } from '@/hooks/useLocale';

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

const StyledPaper = styled(Paper)`
  padding: 16px;
  margin-top: 16px;
  background-color: #f5f8ff;
`;

const StyledChip = styled(Chip)`
  margin-right: 8px;
  margin-bottom: 8px;
`;

const StyledLinearProgress = styled(LinearProgress)`
  margin: 16px 0;
`;

const StyledFileIcon = styled(DescriptionIcon)`
  margin-right: 8px;
  color: #1976d2;
`;

const StyledListItem = styled(ListItem)`
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  background-color: white;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const StyledSubjectName = styled(Typography)`
  font-weight: 500;
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
  
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { 
    generateSubjects, 
    generatedSubjects, 
    generating, 
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    clearGeneratedSubjects,
    saveGeneratedSubjects,
    resetState
  } = useSubjectManagement(userId);

  const handleFileChange = (event: SelectChangeEvent) => {
    setSelectedFileId(event.target.value);
    setErrorMsg(null);
  };

  const handleGenerateSubjects = async () => {
    if (!selectedFileId) {
      setErrorMsg('Please select a file to generate subjects from.');
      return;
    }

    try {
      const params: SubjectGenerationParams = {
        workspaceId,
        fileId: selectedFileId,
        userId,
        locale: userLocale
      };
      
      const subjects = await generateSubjects(params);
      
      if (subjects.length === 0) {
        setErrorMsg('No new subjects could be generated from this file. Try another file or create subjects manually.');
      }
      
      if (onSubjectsGenerated) {
        onSubjectsGenerated(subjects);
      }
    } catch (err) {
      console.error('Failed to generate subjects:', err);
      setErrorMsg('An error occurred during subject generation. Please try again.');
    }
  };

  const handleSaveSubject = async (subject: Subject) => {
    try {
      await createSubject(
        workspaceId,
        subject.name
      );
    } catch (err) {
      console.error('Failed to save subject:', err);
      setErrorMsg('An error occurred while saving the subject. Please try again.');
    }
  };

  const handleSaveAll = async () => {
    if (!generatedSubjects || generatedSubjects.length === 0) {
      return;
    }
    
    try {
      const savedSubjects = await saveGeneratedSubjects();
      if (savedSubjects) {
        onSubjectsGenerated(savedSubjects);
        // Close the dialog after a short delay to show the success state
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save all subjects:', err);
      setErrorMsg('An error occurred while saving subjects. Please try again.');
    }
  };

  const handleEditClick = (subject: Subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
  };

  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    
    try {
      // If the subject already has an ID, it means it's already saved in the database
      if (editingSubject.id) {
        await updateSubject(editingSubject.id, {
          name: editName
        });
      } else {
        // This is a generated subject that hasn't been saved yet
        // Update it in the generatedSubjects array
        const updatedGeneratedSubjects = generatedSubjects?.map(subject => 
          subject === editingSubject 
            ? { ...subject, name: editName }
            : subject
        ) || [];
        
        // Update the state
        // We're using a workaround here since we can't directly modify generatedSubjects
        clearGeneratedSubjects();
        setTimeout(() => {
          if (onSubjectsGenerated) {
            onSubjectsGenerated(updatedGeneratedSubjects as Subject[]);
          }
        }, 0);
      }
      
      // Reset editing state
      setEditingSubject(null);
      setEditName('');
    } catch (err) {
      console.error('Failed to save edit:', err);
      setErrorMsg('An error occurred while saving changes. Please try again.');
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    try {
      if (subject.id) {
        // If the subject has an ID, it's already in the database
        await deleteSubject(subject.id);
      } else {
        // This is a generated subject that hasn't been saved yet
        // Remove it from the generatedSubjects array
        const updatedGeneratedSubjects = generatedSubjects?.filter(s => s !== subject) || [];
        
        // Update the state
        clearGeneratedSubjects();
        setTimeout(() => {
          if (onSubjectsGenerated) {
            onSubjectsGenerated(updatedGeneratedSubjects as Subject[]);
          }
        }, 0);
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
      setErrorMsg('An error occurred while deleting the subject. Please try again.');
    }
  };

  const handleClose = () => {
    if (!generating) {
      resetState();
      setSelectedFileId('');
      setEditingSubject(null);
      setEditName('');
      setErrorMsg(null);
      clearGeneratedSubjects();
      onClose();
    }
  };

  const renderFileSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Generate Subjects from File
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Select a file from your workspace to analyze and automatically generate subject areas.
        The AI will identify main topics and concepts from your content. 
        Any new subjects will be added to your existing subjects.
      </Typography>
      
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="file-select-label">Select File</InputLabel>
        <Select
          labelId="file-select-label"
          value={selectedFileId}
          onChange={handleFileChange}
          label="Select File"
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
          Cancel
        </Button>
        <Button 
          onClick={handleGenerateSubjects} 
          variant="contained" 
          color="primary"
          disabled={!selectedFileId || generating}
          startIcon={<AutoAwesomeIcon />}
        >
          Generate Subjects
        </Button>
      </Box>
    </Box>
  );

  const renderSubjectsList = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Generated Subjects
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Review the newly generated subjects below. These are subjects that don't exist in your workspace yet. 
        You can save all of them or select individual subjects to save.
      </Typography>
      
      {generating && (
        <>
          <StyledLinearProgress />
          <Typography variant="body2" align="center" color="textSecondary">
            Analyzing content and generating subjects...
          </Typography>
        </>
      )}
      
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
      
      {!generating && generatedSubjects && generatedSubjects.length > 0 && (
        <List sx={{ mt: 2 }}>
          {generatedSubjects.map((subject, index) => (
            <StyledListItem key={index}>
              <ListItemText
                primary={<StyledSubjectName>{subject.name}</StyledSubjectName>}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEditClick(subject)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteSubject(subject)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </StyledListItem>
          ))}
        </List>
      )}
      
      {!generating && (!generatedSubjects || generatedSubjects.length === 0) && !error && (
        <StyledPaper elevation={0}>
          <Typography variant="body2" color="textSecondary" align="center">
            No subjects have been generated yet. Select a file and click "Generate Subjects" to start.
          </Typography>
        </StyledPaper>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        {generatedSubjects && generatedSubjects.length > 0 && (
          <Button 
            onClick={handleSaveAll} 
            variant="contained" 
            color="primary"
            disabled={generating}
          >
            Save All Subjects
          </Button>
        )}
      </Box>
    </Box>
  );

  const renderEditForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Edit Subject
      </Typography>
      
      <TextField
        label="Subject Name"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        fullWidth
        margin="normal"
        variant="outlined"
      />
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          onClick={() => setEditingSubject(null)} 
          color="inherit" 
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveEdit} 
          variant="contained" 
          color="primary"
          disabled={!editName.trim()}
        >
          Save
        </Button>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        Subject Generation
        <StyledCloseButton onClick={handleClose}>
          <CloseIcon />
        </StyledCloseButton>
      </StyledDialogTitle>
      
      <DialogContent>
        {editingSubject 
          ? renderEditForm() 
          : (generatedSubjects && generatedSubjects.length > 0) || generating
            ? renderSubjectsList()
            : renderFileSelection()
        }
      </DialogContent>
    </Dialog>
  );
};

export default SubjectGenerationDialog; 