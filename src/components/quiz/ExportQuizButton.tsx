"use client";
import React, { useState } from 'react';
import { Button, IconButton, Tooltip, CircularProgress, SxProps, Theme } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { saveAs } from 'file-saver';
import { exportQuizClient } from '@/app/lib-client/quizClient';
import { useAuth } from '@/contexts/AuthContext';
import { useRTL } from '@/contexts/RTLContext';

interface ExportQuizButtonProps {
  quizId: string;
  quizTitle: string;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  label?: string;
  sx?: SxProps<Theme>;
}

const ExportQuizButton: React.FC<ExportQuizButtonProps> = ({
  quizId,
  quizTitle,
  variant = 'button',
  size = 'medium',
  color = 'primary',
  label = 'Export to Word',
  sx = {}
}) => {
  const [exporting, setExporting] = useState(false);
  const { accessToken } = useAuth();
  const { isRTL } = useRTL();

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!quizId) {
      alert('Quiz ID is missing. Cannot export.');
      return;
    }

    if (!accessToken) {
      alert('You must be logged in to export quizzes.');
      return;
    }
    
    try {
      setExporting(true);
      
      // Use the quizClient to export with authentication token
      const blob = await exportQuizClient(quizId, accessToken);
      
      // Use FileSaver to save the file
      const fileName = `Quiz-${quizTitle.replace(/[^a-zA-Z0-9]/g, '-')}.docx`;
      saveAs(blob, fileName);
      
    } catch (error) {
      console.error('Failed to export quiz:', error);
      alert('Failed to export quiz. Please try again later.');
    } finally {
      setExporting(false);
    }
  };

  // If variant is icon, render an IconButton
  if (variant === 'icon') {
    return (
      <Tooltip title={label} placement={isRTL ? 'left' : 'right'}>
        <span>
          <IconButton
            size={size}
            color={color}
            onClick={handleExport}
            disabled={exporting}
            sx={{ ...sx, transform: isRTL ? 'scaleX(-1)' : 'none' }}
          >
            {exporting ? (
              <CircularProgress size={size === 'small' ? 20 : 24} color="inherit" />
            ) : (
              <FileDownloadIcon fontSize={size} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  // Otherwise render a normal Button
  return (
    <Button
      variant="contained"
      color={color}
      size={size}
      onClick={handleExport}
      disabled={exporting}
      startIcon={
        exporting ? (
          <CircularProgress size={size === 'small' ? 16 : 20} color="inherit" />
        ) : (
          <FileDownloadIcon />
        )
      }
      sx={{ 
        ...sx, 
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }}
    >
      {label}
    </Button>
  );
};

export default ExportQuizButton; 