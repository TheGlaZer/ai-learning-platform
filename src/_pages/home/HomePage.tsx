"use client";

import React from 'react';
import { Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import * as colors from '../../../colors';
import { 
  HeroSection,
  FeatureSection,
  TestimonialSection,
  CTASection
} from './components';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const t = useTranslations('HomePage');
  const { isAuthenticated } = useAuth();
  const locale = useLocale();
  const isRtl = locale === 'he';

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        gap: 8,
        backgroundColor: colors.surface.background,
        direction: isRtl ? 'rtl' : 'ltr',
        px: {
          xs: 0, // No padding on mobile
          md: 6, // Medium padding on medium screens (tablets)
          lg: 12, // Large padding on large screens (desktops)
        }
      }}
    >
      <HeroSection isRtl={isRtl} />
      <FeatureSection isRtl={isRtl} />
      <TestimonialSection isRtl={isRtl} />
      <CTASection isRtl={isRtl} />
    </Box>
  );
};

export default HomePage; 