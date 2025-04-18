"use client";
import React, { useState } from 'react';
import { 
  Box, 
  ListItemIcon, 
  ListItemText,
  Tooltip
} from '@mui/material';
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import { primary, secondary, accent } from '../../../../colors';
import {
  ActionMenuAvatar,
  StyledMenu,
  StyledMenuItem,
  MenuDivider
} from './DashboardStyledComponents';

interface ActionMenuProps {
  onGenerateSubjects: () => void;
  onGenerateQuiz: () => void;
  onUploadFile: () => void;
  onUploadPastExam: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  onGenerateSubjects,
  onGenerateQuiz,
  onUploadFile,
  onUploadPastExam
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const t = useTranslations('Dashboard');
  const { isRTL } = useRTL();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (callback: () => void) => {
    callback();
    handleClose();
  };

  return (
    <Box>
      <Tooltip title={t('mainActions')} placement={isRTL ? "left" : "right"}>
        <ActionMenuAvatar onClick={handleClick}>
          <EmojiObjectsOutlinedIcon fontSize="large" />
        </ActionMenuAvatar>
      </Tooltip>

      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={e => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <StyledMenuItem 
          onClick={() => handleMenuItemClick(onGenerateSubjects)}
          color={accent.purple.main}
        >
          <ListItemIcon>
            <CategoryOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('generateSubjects')} />
        </StyledMenuItem>

        <StyledMenuItem 
          onClick={() => handleMenuItemClick(onGenerateQuiz)}
          color={primary.main}
        >
          <ListItemIcon>
            <QuizOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('generateQuiz')} />
        </StyledMenuItem>

        <MenuDivider />

        <StyledMenuItem 
          onClick={() => handleMenuItemClick(onUploadFile)}
          color={accent.green.main}
        >
          <ListItemIcon>
            <CloudUploadOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('uploadFile')} />
        </StyledMenuItem>

        <StyledMenuItem 
          onClick={() => handleMenuItemClick(onUploadPastExam)}
          color={secondary.main}
        >
          <ListItemIcon>
            <HistoryEduOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('uploadPastExam')} />
        </StyledMenuItem>
      </StyledMenu>
    </Box>
  );
};

export default ActionMenu; 