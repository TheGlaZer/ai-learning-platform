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
  Alert
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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.name || '');
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
      
      const updates: Partial<FileMetadata> = {
        name,
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={loading}
            required
            autoFocus
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
          disabled={loading || !name.trim() || success}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileMetadataDialog; 