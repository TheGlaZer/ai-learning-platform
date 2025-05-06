"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { CircularProgress, Box } from '@mui/material';
import PatternsPage from "@/_pages/patterns/PatternsPage";

// Use dynamic import with SSR disabled to prevent flashing of auth components
const AuthGuardWithNoSSR = dynamic(
  () => import('@/components/AuthGuard'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={100} />
      </Box>
    )
  }
);

const PatternsClientWrapper = () => {
  return (
    <AuthGuardWithNoSSR>
      <PatternsPage />
    </AuthGuardWithNoSSR>
  );
};

export default PatternsClientWrapper; 