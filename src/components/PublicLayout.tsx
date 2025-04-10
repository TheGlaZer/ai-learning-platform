"use client";

import React from 'react';
import { Box, Container } from '@mui/material';
import SimpleHeader from './SimpleHeader';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SimpleHeader />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: { xs: 8, sm: 9 }, // Provide space for fixed header
          pb: 4,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default PublicLayout; 