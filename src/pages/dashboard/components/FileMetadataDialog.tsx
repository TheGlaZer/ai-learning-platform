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
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.name || '');
      setDescription(file.metadata?.description || '');
    }
  }, [file]);

  const handleSave = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create updated metadata
      const updatedMetadata = {
        ...file.metadata,
        description
      };
      
      // Create updates object
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Edit File Information</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
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
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={loading}
            placeholder="Add a description for this file..."
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
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