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
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { primary, accent, text, gradients, background, surface } from '../../../../colors';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';

interface WorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateWorkspace: (name: string) => Promise<boolean>;
}

const WorkspaceDialog: React.FC<WorkspaceDialogProps> = ({
  open,
  onClose,
  onCreateWorkspace
}) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const t = useTranslations('Workspace.createDialog');
  const commonT = useTranslations('Common');
  const { isRTL } = useRTL();

  const handleSubmit = async () => {
    if (!newWorkspaceName.trim()) {
      setDialogError(t('nameRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onCreateWorkspace(
        newWorkspaceName.trim()
      );
      
      if (result) {
        setSuccessMessage(t('successMessage', { name: newWorkspaceName.trim() }));
        handleReset();
        onClose();
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setDialogError(t('nameRequired'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNewWorkspaceName('');
    setDialogError(null);
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: 400,
            minHeight: 250,
            borderRadius: 2,
            backgroundColor: background.paper,
            backgroundImage: `linear-gradient(135deg, ${primary.light}05, ${accent.purple.light}10)`,
            boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.15)`,
            border: `1px solid ${surface.border}`,
            direction: isRTL ? 'rtl' : 'ltr'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            fontWeight: 'bold',
            background: gradients.textGradient,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {t('title')}
        </DialogTitle>
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
              label={t('nameLabel')}
              type="text"
              fullWidth
              variant="outlined"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: primary.main,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: primary.main,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={onClose} 
            disabled={isSubmitting}
            sx={{ 
              color: text.secondary,
              '&:hover': {
                backgroundColor: background.hover
              }
            }}
          >
            {commonT('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting || !newWorkspaceName.trim()}
            sx={{
              background: gradients.primaryGradient,
              color: primary.contrastText,
              fontWeight: 'medium',
              '&:hover': {
                background: gradients.ctaGradient,
                boxShadow: `0px 4px 8px ${primary.transparent}`
              },
              '&:disabled': {
                background: text.disabled,
                color: text.light
              }
            }}
          >
            {isSubmitting ? t('creating') : t('create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={5000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccessMessage} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            backgroundColor: '#4caf50',
            color: '#fff',
            fontWeight: 'medium',
            direction: isRTL ? 'rtl' : 'ltr'
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WorkspaceDialog;