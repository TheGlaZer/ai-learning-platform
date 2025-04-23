"use client";
import React, { useState } from 'react';
import styled from '@emotion/styled';
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
  IconButton,
  PaperProps
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { useFileUpload, ALLOWED_FILE_EXTENSIONS } from '@/hooks/useFileUpload';
import { FileMetadata } from '@/app/models/file';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslations } from 'next-intl';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onFileUploaded: (file: FileMetadata) => void;
}

interface UploadZoneProps extends PaperProps {
  isDragging: boolean;
}

const UploadZone = styled(Paper)<UploadZoneProps>`
  padding: 2rem;
  border: 2px dashed ${props => props.isDragging ? '#2196f3' : '#cccccc'};
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background-color: ${props => props.isDragging ? 'rgba(33, 150, 243, 0.04)' : 'transparent'};
  transition: all 0.3s ease;
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-color: #999999;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const StyledCloseButton = styled(IconButton)<{ isRTL?: boolean }>`
  margin-left: ${props => props.isRTL ? '0' : 'auto'};
  margin-right: ${props => props.isRTL ? 'auto' : '0'};
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
  const { isRTL } = useRTL();
  const t = useTranslations('FileUpload');
  const commonT = useTranslations('Common');
  
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
      alert(`${t('invalidFileType')} ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
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
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          direction: isRTL ? 'rtl' : 'ltr'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t('title')}</Typography>
        <StyledCloseButton onClick={handleClose} disabled={isUploading} isRTL={isRTL}>
          <CloseIcon />
        </StyledCloseButton>
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
                {t('dragDropText')}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('browseText')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t('allowedTypes')}: {ALLOWED_FILE_EXTENSIONS.join(', ')}
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
            <Paper sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              <FileTypeIcon fileType={selectedFile.type} />
              <Box sx={{ 
                ml: isRTL ? 0 : 2, 
                mr: isRTL ? 2 : 0, 
                flexGrow: 1,
                textAlign: isRTL ? 'right' : 'left'
              }}>
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
                  {t('uploading')}... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          {commonT('cancel')}
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          startIcon={isUploading ? null : <CloudUploadIcon />}
        >
          {isUploading ? t('uploading') : t('uploadButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;