"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import { PastExam } from '@/app/models/pastExam';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface PastExamDialogProps {
  open: boolean;
  onClose: () => void;
  pastExam?: PastExam | null;
  workspaceId: string;
  onSave: (pastExam: Partial<PastExam>, file?: File) => Promise<void>;
}

// Constants for validation
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE_MB = 10; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

const PastExamDialog: React.FC<PastExamDialogProps> = ({
  open,
  onClose,
  pastExam,
  workspaceId,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [nameError, setNameError] = useState('');
  const [fileTypeError, setFileTypeError] = useState('');
  const [fileSizeError, setFileSizeError] = useState('');

  const isEdit = Boolean(pastExam?.id);

  useEffect(() => {
    if (pastExam) {
      setName(pastExam.name || '');
    } else {
      resetForm();
    }
  }, [pastExam]);

  const resetForm = () => {
    setName('');
    setSelectedFile(null);
    setFileError('');
    setNameError('');
    setFileTypeError('');
    setFileSizeError('');
  };

  const validateFileType = (file: File): boolean => {
    // Check file type
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
    
    // Also check extension as a fallback
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );
    
    return isValidType || hasValidExtension;
  };

  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE_BYTES;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setFileTypeError('');
    setFileSizeError('');
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!validateFileType(file)) {
        setFileTypeError(`Only PDF and DOCX files are allowed.`);
        return;
      }
      
      // Validate file size
      if (!validateFileSize(file)) {
        setFileSizeError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }
      
      setSelectedFile(file);
      setFileError('');
    }
  };

  const handleSave = async () => {
    // Validate input
    let isValid = true;

    if (!name.trim()) {
      setNameError('Please enter a name for the exam');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!isEdit && !selectedFile) {
      setFileError('Please select a file');
      isValid = false;
    } else {
      setFileError('');
    }
    
    // Don't proceed if there are file validation errors
    if (fileTypeError || fileSizeError) {
      isValid = false;
    }

    if (!isValid) return;

    try {
      setLoading(true);
      
      // Prepare exam data for saving
      const examData: Partial<PastExam> = {
        name,
        workspace_id: workspaceId,
      };

      if (pastExam?.id) {
        examData.id = pastExam.id;
      }

      await onSave(examData, selectedFile || undefined);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving past exam:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isEdit ? 'Edit Past Exam' : 'Upload Past Exam'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Only PDF and DOCX files up to {MAX_FILE_SIZE_MB} MB are accepted for past exams.
          </Alert>

          <TextField
            label="Exam Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            error={!!nameError}
            helperText={nameError}
            disabled={loading}
          />
          
          {!isEdit && (
            <Box sx={{ mt: 2 }}>
              <input
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="raised-button-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                  fullWidth
                >
                  {selectedFile ? selectedFile.name : 'Select File'}
                </Button>
              </label>
              {fileError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {fileError}
                </Typography>
              )}
              {fileTypeError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {fileTypeError}
                </Typography>
              )}
              {fileSizeError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {fileSizeError}
                </Typography>
              )}
              {selectedFile && !fileTypeError && !fileSizeError && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={loading || !!fileTypeError || !!fileSizeError}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {isEdit ? 'Update' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PastExamDialog; 