"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FileMetadata } from '@/app/models/file';

interface FileMetadataDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileMetadata | null;
  onSave: (file: FileMetadata, updates: Partial<FileMetadata>) => Promise<boolean>;
}

const FileMetadataDialog: React.FC<FileMetadataDialogProps> = ({
  open,
  onClose,
  file,
  onSave
}) => {
  const [nameWithoutExtension, setNameWithoutExtension] = useState('');
  const [extension, setExtension] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (file && file.name) {
      // Extract file name and extension
      const lastDotIndex = file.name.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        setNameWithoutExtension(file.name.substring(0, lastDotIndex));
        setExtension(file.name.substring(lastDotIndex));
      } else {
        setNameWithoutExtension(file.name);
        setExtension('');
      }
    }
  }, [file]);

  const handleSave = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedMetadata = {
        ...file.metadata
      };
      
      // Combine name and extension for save
      const fullName = nameWithoutExtension + extension;
      
      const updates: Partial<FileMetadata> = {
        name: fullName,
        metadata: updatedMetadata
      };
      
      const success = await onSave(file, updates);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError('Failed to save file metadata. Please try again.');
      }
    } catch (err) {
      console.error('Error saving file metadata:', err);
      setError('An error occurred while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6">Edit File Information</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            File information saved successfully!
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="File Name"
            value={nameWithoutExtension}
            onChange={(e) => setNameWithoutExtension(e.target.value)}
            fullWidth
            disabled={loading}
            required
            autoFocus
            InputProps={{
              endAdornment: extension ? (
                <InputAdornment position="end">
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ opacity: 0.7 }}
                  >
                    {extension}
                  </Typography>
                </InputAdornment>
              ) : null
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={loading || !nameWithoutExtension.trim() || success}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileMetadataDialog; 