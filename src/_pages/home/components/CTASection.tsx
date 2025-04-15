"use client";

import React from 'react';
import { Box, Button, Container, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import * as colors from '../../../../colors';
import { useTranslations } from 'next-intl';

// Styled components
const CTAContainer = styled(Box)(() => ({
  background: colors.gradients.ctaGradient,
  padding: '5rem 0',
  borderRadius: '16px',
  color: colors.text.light,
  position: 'relative',
  overflow: 'hidden',
}));

const CTAButton = styled(Button)(() => ({
  padding: '0.75rem 2rem',
  borderRadius: '30px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.25)',
  },
}));

const FloatingShape = styled(Box)(() => ({
  position: 'absolute',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.1)',
}));

interface CTASectionProps {
  isRtl: boolean;
}

const CTASection: React.FC<CTASectionProps> = ({ isRtl }) => {
  const theme = useTheme();
  const t = useTranslations('HomePage');

  const ArrowIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;

  return (
    <CTAContainer>
      {/* Decorative elements */}
      <FloatingShape 
        sx={{ 
          width: 300, 
          height: 300, 
          top: -150, 
          right: isRtl ? 'auto' : -100,
          left: isRtl ? -100 : 'auto',
        }}
      />
      <FloatingShape 
        sx={{ 
          width: 200, 
          height: 200, 
          bottom: -100, 
          left: isRtl ? 'auto' : '5%',
          right: isRtl ? '5%' : 'auto',
        }}
      />
      
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            textAlign: 'center', 
            maxWidth: 800, 
            mx: 'auto', 
            position: 'relative', 
            zIndex: 2 
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: colors.text.light }}>
            {t('ctaTitle')}
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, opacity: 0.9, color: colors.text.light }}>
            {t('ctaSubtitle')}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexDirection: 'row' }}>
            <Link href="/login" passHref style={{ textDecoration: 'none' }}>
              <CTAButton 
                variant="outlined" 
                sx={{ 
                  color: colors.text.light, 
                  borderColor: colors.text.light,
                  '&:hover': { 
                    borderColor: colors.text.light,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  } 
                }}
              >
                {t('ctaButtonLearn')}
              </CTAButton>
            </Link>
            
            <Link href="/signup" passHref style={{ textDecoration: 'none' }}>
              <CTAButton 
                variant="contained" 
                endIcon={<ArrowIcon />}
                sx={{ 
                  bgcolor: colors.accent.yellow.main, 
                  color: colors.accent.yellow.contrastText,
                  ml: 2,
                  '&:hover': { 
                    bgcolor: colors.accent.yellow.dark, 
                  } 
                }}
              >
                {t('ctaButtonStart')}
              </CTAButton>
            </Link>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.8, color: colors.text.light }}>
            {t('ctaNoCredit')}
          </Typography>
        </Box>
      </Container>
    </CTAContainer>
  );
};

export default CTASection; 