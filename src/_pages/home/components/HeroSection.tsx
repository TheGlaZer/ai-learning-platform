"use client";

import React from 'react';
import { Box, Button, Container, Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Image from 'next/image';
import * as colors from '../../../../colors';
import { useTranslations } from 'next-intl';

// Styled components
const HeroContainer = styled(Box)(() => ({
  position: 'relative',
  padding: '5rem 0',
  overflow: 'hidden',
  background: colors.gradients.heroGradient,
  borderRadius: '16px',
  marginTop: '16px',
}));

const GradientText = styled(Typography)(() => ({
  backgroundImage: colors.gradients.textGradient,
  backgroundClip: 'text',
  textFillColor: 'transparent',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'inline-block',
}));

const HeroButton = styled(Button)(({ theme }) => ({
  padding: '0.75rem 2rem',
  borderRadius: '30px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const FloatingCircle = styled(Box)(() => ({
  position: 'absolute',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${colors.accent.purple.light}33, ${colors.accent.green.light}22)`,
  opacity: 0.6,
}));

interface HeroSectionProps {
  isRtl: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isRtl }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const t = useTranslations('HomePage');

  return (
    <HeroContainer>
      {/* Floating decoration elements */}
      <FloatingCircle 
        sx={{ 
          width: 200, 
          height: 200, 
          top: -50, 
          right: isRtl ? 'auto' : -50,
          left: isRtl ? -50 : 'auto',
          display: { xs: 'none', md: 'block' }
        }}
      />
      <FloatingCircle 
        sx={{ 
          width: 120, 
          height: 120, 
          bottom: 50, 
          left: isRtl ? 'auto' : '10%',
          right: isRtl ? '10%' : 'auto',
          display: { xs: 'none', md: 'block' }
        }}
      />

      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center" direction={isRtl ? 'row-reverse' : 'row'}>
          {/* Image section (now first in LTR layout) */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box 
              sx={{ 
                position: 'relative',
                height: { sm: '400px', md: '500px' },
                width: '100%',
              }}
            >
              <Box
                component="img"
                src="/images/ai-learning-hero.png"
                alt="AI Learning Platform"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0px 10px 20px rgba(0, 0, 0, 0.15))',
                }}
              />
            </Box>
          </Grid>
          
          {/* Text section (now second in LTR layout) */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', zIndex: 2, textAlign: isRtl ? 'right' : 'left' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                justifyContent: isRtl ? 'flex-end' : 'flex-start',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <Logo width={60} height={60} color={colors.primary.main} />
                <Typography variant="h6" sx={{ 
                  ml: isRtl ? 0 : 1, 
                  mr: isRtl ? 1 : 0, 
                  fontWeight: 600, 
                  color: colors.text.primary 
                }}>
                  {t('platformName')}
                </Typography>
              </Box>
              <Typography variant="h2" component="h1" sx={{ fontWeight: 700, mb: 2, color: colors.text.primary }}>
                {t('heroTitle')}
                <GradientText variant="h2" sx={{ display: 'block', fontWeight: 700 }}>
                  {t('heroSubtitle')}
                </GradientText>
              </Typography>
              <Typography variant="h6" sx={{ 
                mb: 4, 
                maxWidth: '90%', 
                color: colors.text.secondary,
                marginLeft: isRtl ? 'auto' : 0,
                marginRight: isRtl ? 0 : 'auto'
              }}>
                {t('heroDescription')}
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: isRtl ? 'flex-end' : 'flex-start',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <Link href="/signup" passHref style={{ textDecoration: 'none' }}>
                  <HeroButton 
                    variant="contained" 
                    sx={{ 
                      bgcolor: colors.secondary.main, 
                      color: colors.secondary.contrastText,
                      '&:hover': { bgcolor: colors.secondary.dark } 
                    }}
                  >
                    {t('getStartedButton')}
                  </HeroButton>
                </Link>
                <Link href="/login" passHref style={{ textDecoration: 'none' }}>
                  <HeroButton 
                    variant="outlined" 
                    sx={{ 
                      color: colors.primary.main, 
                      borderColor: colors.primary.main,
                      '&:hover': { borderColor: colors.primary.dark, color: colors.primary.dark } 
                    }}
                  >
                    {t('signInButton')}
                  </HeroButton>
                </Link>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mt: 4,
                justifyContent: isRtl ? 'flex-end' : 'flex-start',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <Box sx={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '2px solid white',
                        marginLeft: isRtl ? (i === 2 ? '-10px' : 0) : (i > 0 ? '-10px' : 0),
                        marginRight: isRtl ? (i < 2 ? '-10px' : 0) : 0,
                        background: `url(/images/avatar-${i + 1}.jpg)`,
                        backgroundSize: 'cover',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  {t.rich('joinStudentsText', { count: '10,000+' })}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </HeroContainer>
  );
};

export default HeroSection; 