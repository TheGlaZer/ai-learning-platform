"use client";
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslations } from 'next-intl';
import { primary, accent, gradients } from '../../../../colors';
import SchoolIcon from '@mui/icons-material/School';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

const BannerContainer = styled(Box)`
  padding: 1.5rem;
  border-radius: 12px;
  background: ${gradients.ctaGradient};
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
`;

const FeatureItem = styled(Box)`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
`;

const FeatureIcon = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const BackgroundCircle = styled(Box)`
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
`;

const WelcomeBanner: React.FC = () => {
  const t = useTranslations('SignupPage');
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
      
      <BannerTitle variant="h4">
        {t('welcomeTitle')}
      </BannerTitle>
      
      <BannerText>
        {t('welcomeSubtitle')}
      </BannerText>
      
      <Box>
        <FeatureItem>
          <FeatureIcon>
            <SchoolIcon fontSize="small" />
          </FeatureIcon>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" fontSize="0.85rem">
              {t('feature1Title')}
            </Typography>
            <Typography variant="body2" fontSize="0.8rem">
              {t('feature1Desc')}
            </Typography>
          </Box>
        </FeatureItem>
        
        <FeatureItem>
          <FeatureIcon>
            <EmojiObjectsIcon fontSize="small" />
          </FeatureIcon>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" fontSize="0.85rem">
              {t('feature2Title')}
            </Typography>
            <Typography variant="body2" fontSize="0.8rem">
              {t('feature2Desc')}
            </Typography>
          </Box>
        </FeatureItem>
        
        <FeatureItem>
          <FeatureIcon>
            <AutoStoriesIcon fontSize="small" />
          </FeatureIcon>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" fontSize="0.85rem">
              {t('feature3Title')}
            </Typography>
            <Typography variant="body2" fontSize="0.8rem">
              {t('feature3Desc')}
            </Typography>
          </Box>
        </FeatureItem>
      </Box>
    </BannerContainer>
  );
};

export default WelcomeBanner; 