"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';

interface WorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateWorkspace: (name: string, description?: string) => Promise<boolean>;
}

const WorkspaceDialog: React.FC<WorkspaceDialogProps> = ({
  open,
  onClose,
  onCreateWorkspace
}) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newWorkspaceName.trim()) {
      setDialogError('Workspace name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onCreateWorkspace(
        newWorkspaceName.trim(),
        newWorkspaceDescription.trim() || undefined
      );
      
      if (result) {
        handleReset();
        onClose();
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setDialogError('Failed to create workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setDialogError(null);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Workspace</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {dialogError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {dialogError}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Workspace Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newWorkspaceDescription}
            onChange={(e) => setNewWorkspaceDescription(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isSubmitting || !newWorkspaceName.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkspaceDialog;