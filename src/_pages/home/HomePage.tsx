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
import PublicLayout from '@/components/PublicLayout';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const t = useTranslations('HomePage');
  const { isAuthenticated } = useAuth();
  const locale = useLocale();
  const isRtl = locale === 'he';

  const HomeContent = () => (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        gap: 8,
        backgroundColor: colors.surface.background,
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      <HeroSection isRtl={isRtl} />
      <FeatureSection isRtl={isRtl} />
      <TestimonialSection isRtl={isRtl} />
      <CTASection isRtl={isRtl} />
    </Box>
  );

  // Use AppLayout for authenticated users, PublicLayout for guests
  return isAuthenticated ? (
    <AppLayout>
      <HomeContent />
    </AppLayout>
  ) : (
    <PublicLayout>
      <HomeContent />
    </PublicLayout>
  );
};

export default HomePage; 