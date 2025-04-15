'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button, 
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslations } from 'next-intl';
import { useUserLocale } from '@/hooks/useLocale';
import { primary, secondary } from '../../../../colors';

interface DeleteWorkspaceDialogProps {
  open: boolean;
  workspaceName?: string;
  onClose: () => void;
  onDeleteWorkspace: () => Promise<boolean>;
}

const DeleteWorkspaceDialog: React.FC<DeleteWorkspaceDialogProps> = ({
  open,
  workspaceName = '',
  onClose,
  onDeleteWorkspace
}) => {
  const t = useTranslations('Workspace.deleteDialog');
  const commonT = useTranslations('Common');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const success = await onDeleteWorkspace();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isDeleting ? onClose : undefined}
      aria-labelledby="delete-workspace-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle 
        id="delete-workspace-dialog-title"
        sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <WarningIcon color="error" />
        <Typography variant="h6" component="span" fontWeight="bold">
          {t('title')}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText sx={{ color: 'text.primary', mb: 2 }}>
          {t('message')}
        </DialogContentText>
        
        <Box sx={{ 
          bgcolor: 'error.light', 
          color: 'error.contrastText', 
          p: 2, 
          borderRadius: 1,
          fontSize: '0.9rem',
          mb: 2
        }}>
          <Typography variant="body2" fontWeight="medium">
            {t('warning')}
          </Typography>
        </Box>

        <DialogContentText 
          sx={{ 
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: '1rem'
          }}
        >
          {t('confirmationQuestion', { name: workspaceName || t('thisWorkspace') })}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isDeleting}
          sx={{ 
            borderColor: 'grey.400',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'grey.600',
            }
          }}
        >
          {commonT('cancel')}
        </Button>
        <Button 
          onClick={handleDelete}
          variant="contained"
          disabled={isDeleting}
          sx={{ 
            bgcolor: secondary.main,
            '&:hover': {
              bgcolor: secondary.dark
            }
          }}
          startIcon={isDeleting ? <CircularProgress size={24} color="inherit" /> : null}
        >
          {isDeleting ? t('deleting') : t('confirmDelete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteWorkspaceDialog; 