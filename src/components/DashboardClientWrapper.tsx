"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { CircularProgress, Box } from '@mui/material';
import DashboardPage from "@/_pages/dashboard/DashboardPage";

// Use dynamic import with SSR disabled to prevent flashing of auth components
const AuthGuardWithNoSSR = dynamic(
  () => import('@/components/AuthGuard'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }
);

const DashboardClientWrapper = () => {
  return (
    <AuthGuardWithNoSSR>
      <DashboardPage />
    </AuthGuardWithNoSSR>
  );
};

export default DashboardClientWrapper; 