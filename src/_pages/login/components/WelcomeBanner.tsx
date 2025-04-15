"use client";
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, Paper } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslations } from 'next-intl';
import { primary, accent, gradients } from '../../../../colors';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Image from 'next/image';

const BannerContainer = styled(Box)`
  padding: 1.5rem;
  border-radius: 12px;
  background: ${gradients.secondaryGradient};
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  height: 100%;
  min-height: 320px;
  position: relative;
  overflow: hidden;
`;

const BannerTitle = styled(Typography)`
  font-weight: 700;
  position: relative;
  z-index: 1;
  font-size: 1.75rem;
`;

const BannerText = styled(Typography)`
  position: relative;
  z-index: 1;
  max-width: 400px;
  font-size: 0.9rem;
  text-align: center;
`;

const IconWrapper = styled(Box)`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
`;

const BackgroundCircle = styled(Box)`
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
`;

const WelcomeBanner: React.FC = () => {
  const t = useTranslations('LoginPage');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (isMobile) return null;
  
  return (
    <BannerContainer>
      <BackgroundCircle
        sx={{
          width: '200px',
          height: '200px',
          top: '-100px',
          right: '-100px',
        }}
      />
      <BackgroundCircle
        sx={{
          width: '180px',
          height: '180px',
          bottom: '10px',
          left: '-80px',
        }}
      />
      
      <IconWrapper>
        <LockOutlinedIcon sx={{ fontSize: '2rem' }} />
      </IconWrapper>
      
      <BannerTitle variant="h4">
        {t('welcomeTitle')}
      </BannerTitle>
      
      <BannerText>
        {t('welcomeSubtitle')}
      </BannerText>
    </BannerContainer>
  );
};

export default WelcomeBanner; 