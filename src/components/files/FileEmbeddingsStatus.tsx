"use client";
import React, { useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Tooltip, 
  IconButton 
} from '@mui/material';
import { useFileEmbeddings } from '@/hooks/useFileEmbeddings';
import { useTranslations } from 'next-intl';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface FileEmbeddingsStatusProps {
  fileId: string;
  fileName?: string;
  showGenerateButton?: boolean;
}

const StyledStatusContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const StatusRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

/**
 * Component that shows file embedding status and allows manual generation
 */
const FileEmbeddingsStatus: React.FC<FileEmbeddingsStatusProps> = ({ 
  fileId, 
  fileName,
  showGenerateButton = true 
}) => {
  const t = useTranslations('FileEmbeddings');
  const { 
    status, 
    isLoading, 
    error, 
    getEmbeddingStatus, 
    generateEmbeddings,
    isPolling
  } = useFileEmbeddings();

  useEffect(() => {
    if (fileId) {
      getEmbeddingStatus(fileId);
    }
  }, [fileId, getEmbeddingStatus]);

  const handleGenerateEmbeddings = async () => {
    if (fileId) {
      await generateEmbeddings(fileId);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <StyledStatusContainer>
      <Typography variant="subtitle1" fontWeight="medium">
        {t('embeddingsStatus')}
        <Tooltip title={t('embeddingsInfo')}>
          <IconButton size="small" sx={{ ml: 0.5 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      {isLoading && !isPolling && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {status && (
        <>
          <StatusRow>
            <Box minWidth={24} display="flex" justifyContent="center">
              {status.isGenerating ? (
                <CircularProgress size={20} />
              ) : status.hasEmbeddings ? (
                <CheckCircleIcon color="success" />
              ) : (
                <AccessTimeIcon color="disabled" />
              )}
            </Box>
            <Typography>
              {status.isGenerating 
                ? t('generatingEmbeddings') 
                : status.hasEmbeddings 
                  ? t('embeddingsGenerated', { count: status.count }) 
                  : t('noEmbeddings')}
            </Typography>
          </StatusRow>
          
          {status.hasEmbeddings && status.generatedAt && (
            <StatusRow>
              <Box minWidth={24} />
              <Typography variant="body2" color="text.secondary">
                {t('generatedAt')}: {formatDate(status.generatedAt)}
              </Typography>
            </StatusRow>
          )}
          
          {status.error && (
            <StatusRow>
              <ErrorIcon color="error" />
              <Typography color="error">{status.error}</Typography>
            </StatusRow>
          )}
          
          {showGenerateButton && !status.isGenerating && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerateEmbeddings}
              disabled={isLoading || isPolling}
              sx={{ mt: 1, alignSelf: 'flex-start' }}
            >
              {status.hasEmbeddings ? t('regenerateEmbeddings') : t('generateEmbeddings')}
            </Button>
          )}
        </>
      )}
    </StyledStatusContainer>
  );
};

export default FileEmbeddingsStatus; 