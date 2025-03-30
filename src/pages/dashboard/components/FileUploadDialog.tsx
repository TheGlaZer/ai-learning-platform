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
  LinearProgress, 
  Alert, 
  Paper, 
  IconButton 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { useFileUpload, ALLOWED_FILE_EXTENSIONS } from '@/hooks/useFileUpload';
import { FileMetadata } from '@/app/models/file';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onFileUploaded: (file: FileMetadata) => void;
}

const UploadZone = styled(Paper)(({ theme, isDragging }: { theme: any, isDragging: boolean }) => ({
  padding: '2rem',
  border: `2px dashed ${isDragging ? '#2196f3' : '#cccccc'}`,
  borderRadius: '8px',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragging ? 'rgba(33, 150, 243, 0.04)' : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: '#999999'
  }
}));

const HiddenInput = styled.input`
  display: none;
`;

const FileTypeIcon = ({ fileType }: { fileType: string }) => {
  if (fileType.includes('pdf')) {
    return <PictureAsPdfIcon color="error" fontSize="large" />;
  } else if (fileType.includes('word') || fileType.includes('msword')) {
    return <DescriptionIcon color="primary" fontSize="large" />;
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return <SlideshowIcon color="warning" fontSize="large" />;
  }
  return <DescriptionIcon color="action" fontSize="large" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({ 
  open, 
  onClose, 
  workspaceId, 
  onFileUploaded 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { 
    isUploading, 
    error, 
    uploadProgress, 
    uploadFile, 
    resetUploadState,
    validateFileType
  } = useFileUpload();

  const handleClose = () => {
    if (!isUploading) {
      resetUploadState();
      setSelectedFile(null);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!validateFileType(file)) {
      alert(`Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !workspaceId) return;
    
    const result = await uploadFile(workspaceId, selectedFile);
    
    if (result) {
      onFileUploaded(result);
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Upload File</Typography>
        <IconButton onClick={handleClose} disabled={isUploading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!selectedFile ? (
          <>
            <UploadZone 
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & drop your file here
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Allowed file types: {ALLOWED_FILE_EXTENSIONS.join(', ')}
              </Typography>
              <HiddenInput
                id="file-upload-input"
                type="file"
                accept={ALLOWED_FILE_EXTENSIONS.join(',')}
                onChange={handleFileChange}
              />
            </UploadZone>
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 2 }}>
              <FileTypeIcon fileType={selectedFile.type} />
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Typography variant="subtitle1" noWrap>{selectedFile.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
              {!isUploading && (
                <IconButton size="small" onClick={() => setSelectedFile(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
            
            {isUploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Uploading... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          startIcon={isUploading ? null : <CloudUploadIcon />}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;