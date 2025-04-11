"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Subject } from '@/app/models/subject';

interface SubjectAddDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  onAdd: (subject: Partial<Subject>) => Promise<Subject | null>;
}

const SubjectAddDialog: React.FC<SubjectAddDialogProps> = ({
  open,
  onClose,
  workspaceId,
  userId,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }

    try {
      setSaving(true);
      const newSubject: Partial<Subject> = {
        workspaceId,
        userId,
        name: name.trim(),
        description: description.trim() || undefined,
        source: 'manual'
      };
      
      await onAdd(newSubject);
      handleClose();
    } catch (err) {
      console.error('Error adding subject:', err);
      setError('Failed to add subject. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Add New Subject</Typography>
        <IconButton edge="end" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ my: 1 }}>
          <TextField
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            required
            error={!!error && !name.trim()}
            helperText={!!error && !name.trim() ? 'Subject name is required' : ''}
            autoFocus
          />

          <TextField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />

          {error && name.trim() && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          color="primary"
          variant="contained"
          disabled={saving || !name.trim()}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {saving ? 'Adding...' : 'Add Subject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectAddDialog; 