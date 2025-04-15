"use client";

import React from 'react';
import { Box, Container, Grid, Typography, Avatar, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import * as colors from '../../../../colors';
import { useTranslations } from 'next-intl';

// Styled components
const TestimonialContainer = styled(Box)(() => ({
  background: colors.gradients.testimonialGradient,
  padding: '5rem 0',
  borderRadius: '16px',
}));

const TestimonialCard = styled(Box)(() => ({
  padding: '2rem',
  height: '100%',
  borderRadius: '16px',
  position: 'relative',
  backgroundColor: colors.surface.paper,
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${colors.surface.border}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
    borderColor: 'transparent',
  },
}));

const QuoteIcon = styled(FormatQuoteIcon)(() => ({
  position: 'absolute',
  top: -15,
  fontSize: 80,
  transform: 'rotate(180deg)',
  opacity: 0.3,
}));

interface TestimonialSectionProps {
  isRtl: boolean;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ isRtl }) => {
  const theme = useTheme();
  const t = useTranslations('HomePage');

  // More diverse testimonial data with translation keys
  const testimonials = [
    {
      quoteKey: 'testimonials.testimonial1.quote',
      nameKey: 'testimonials.testimonial1.name',
      roleKey: 'testimonials.testimonial1.role',
      avatar: "/images/avatar-1.jpg",
      accentColor: colors.primary.main
    },
    {
      quoteKey: 'testimonials.testimonial2.quote',
      nameKey: 'testimonials.testimonial2.name',
      roleKey: 'testimonials.testimonial2.role',
      avatar: "/images/avatar-2.jpg",
      accentColor: colors.secondary.main
    },
    {
      quoteKey: 'testimonials.testimonial3.quote',
      nameKey: 'testimonials.testimonial3.name',
      roleKey: 'testimonials.testimonial3.role',
      avatar: "/images/avatar-3.jpg",
      accentColor: colors.accent.purple.main
    }
  ];

  return (
    <TestimonialContainer>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: colors.text.primary }}>
            {t('testimonialsTitle')}
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 700, mx: 'auto', color: colors.text.secondary }}>
            {t('testimonialsSubtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4} direction={isRtl ? 'row-reverse' : 'row'}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <TestimonialCard sx={{ textAlign: isRtl ? 'right' : 'left', overflow: 'hidden' }}>
                <QuoteIcon 
                  sx={{ 
                    color: testimonial.accentColor,
                    left: isRtl ? 'auto' : 20,
                    right: isRtl ? 20 : 'auto',
                    transform: isRtl ? 'rotate(0deg)' : 'rotate(180deg)',
                  }} 
                />
                <Box sx={{ mb: 3, zIndex: 1, flex: 1, position: 'relative', pt: 3 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1.1rem', 
                      fontStyle: 'italic', 
                      color: colors.text.primary 
                    }}
                  >
                    "{t(testimonial.quoteKey)}"
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 2,
                  flexDirection: 'row',
                  justifyContent: 'flex-start'
                }}>
                  <Avatar 
                    src={testimonial.avatar}
                    alt={t(testimonial.nameKey)}
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      mr: 2,
                      border: `2px solid ${testimonial.accentColor}20`
                    }}
                  />
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: testimonial.accentColor 
                      }}
                    >
                      {t(testimonial.nameKey)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: colors.text.secondary }}
                    >
                      {t(testimonial.roleKey)}
                    </Typography>
                  </Box>
                </Box>
              </TestimonialCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </TestimonialContainer>
  );
};

export default TestimonialSection; 