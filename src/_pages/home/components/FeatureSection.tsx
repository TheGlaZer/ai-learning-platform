"use client";

import React from 'react';
import { Box, Container, Grid, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import * as colors from '../../../../colors';
import { useTranslations } from 'next-intl';

// Styled components
const SectionTitle = styled(Typography)(() => ({
  fontWeight: 700,
  marginBottom: '8px',
  position: 'relative',
  display: 'inline-block',
  color: colors.text.primary,
}));

const SectionSubtitle = styled(Typography)(() => ({
  color: colors.text.secondary,
  marginBottom: '64px',
  maxWidth: '800px',
  margin: '0 auto',
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  padding: '32px',
  height: '100%',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  background: colors.surface.card,
  border: `1px solid ${colors.surface.border}`,
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    borderColor: 'transparent',
  },
}));

const IconWrapper = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 80,
  height: 80,
  borderRadius: 16,
  marginBottom: '24px',
  background: colors.gradients.featureIconGradient,
}));

interface FeatureSectionProps {
  isRtl: boolean;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ isRtl }) => {
  const theme = useTheme();
  const t = useTranslations('HomePage');

  // Feature data with translated texts
  const features = [
    {
      icon: <SmartToyIcon sx={{ fontSize: 40, color: colors.primary.main }} />,
      titleKey: 'features.aiTutoring.title',
      descriptionKey: 'features.aiTutoring.description',
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 40, color: colors.secondary.main }} />,
      titleKey: 'features.learningPaths.title',
      descriptionKey: 'features.learningPaths.description',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: colors.accent.purple.main }} />,
      titleKey: 'features.progressTracking.title',
      descriptionKey: 'features.progressTracking.description',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40, color: colors.accent.green.main }} />,
      titleKey: 'features.collaborativeLearning.title',
      descriptionKey: 'features.collaborativeLearning.description',
    },
  ];

  return (
    <Box sx={{ 
      py: 10, 
      background: colors.surface.background,
      textAlign: isRtl ? 'right' : 'left'
    }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <SectionTitle variant="h3">
            {t('featuresTitle')}
          </SectionTitle>
          <SectionSubtitle variant="h6">
            {t('featuresSubtitle')}
          </SectionSubtitle>
        </Box>

        <Grid container spacing={4} direction={isRtl ? 'row-reverse' : 'row'}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard sx={{ textAlign: isRtl ? 'right' : 'left' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  width: '100%'
                }}>
                  <IconWrapper>
                    {feature.icon}
                  </IconWrapper>
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: colors.text.primary 
                  }}
                >
                  {t(feature.titleKey)}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ color: colors.text.secondary }}
                >
                  {t(feature.descriptionKey)}
                </Typography>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeatureSection; 