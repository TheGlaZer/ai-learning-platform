"use client";
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Subject } from '@/app/models/subject';

const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
`;

const StyledCloseButton = styled(IconButton)`
  margin-left: auto;
`;

interface SubjectEditDialogProps {
  open: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSave: (id: string, updates: Partial<Subject>) => Promise<void>;
}

const SubjectEditDialog: React.FC<SubjectEditDialogProps> = ({
  open,
  onClose,
  subject,
  onSave
}) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
    } else {
      setName('');
    }
    setError(null);
  }, [subject, open]);

  const handleSave = async () => {
    if (!subject || !subject.id) return;
    
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }

    try {
      setSaving(true);
      await onSave(subject.id, {
        name
      });
      handleClose();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError('Failed to save subject. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        Edit Subject
        <StyledCloseButton onClick={handleClose}>
          <CloseIcon />
        </StyledCloseButton>
      </StyledDialogTitle>

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
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={saving || !name.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectEditDialog; 