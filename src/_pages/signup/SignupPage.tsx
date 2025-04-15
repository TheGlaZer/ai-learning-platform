"use client";
import React from 'react';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

import PublicLayout from '@/components/PublicLayout';
import { SignupForm, WelcomeBanner, PageContainer, BrandingBox } from './components';
import Logo from '@/components/Logo';

const SignUpPage: React.FC = () => {
  const t = useTranslations('SignupPage');
  const theme = useTheme();
  const locale = useLocale();
  const isRtl = locale === 'he';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <PublicLayout>
      <PageContainer 
        sx={{ 
          direction: isRtl ? 'rtl' : 'ltr',
          pb: 4
        }}
      >
        {isMobile && (
          <BrandingBox>
            <Logo width={48} height={48} variant="auto" />
          </BrandingBox>
        )}
        
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            maxWidth: 1000,
            width: '100%'
          }}
        >
          <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
            <SignupForm />
          </Grid>
          
          <Grid 
            item 
            xs={12} 
            md={7} 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center'
            }}
          >
            <WelcomeBanner />
          </Grid>
        </Grid>
      </PageContainer>
    </PublicLayout>
  );
};

export default SignUpPage;
