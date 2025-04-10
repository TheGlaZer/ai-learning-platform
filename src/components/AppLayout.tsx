'use client';

import React, { ReactNode } from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import WorkspaceSidebar from './WorkspaceSidebar';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  
  const SIDEBAR_WIDTH = 250;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <Box 
        component="main" 
        sx={{ 
          display: 'flex',
          flexGrow: 1,
          pt: { xs: 7, sm: 8 }, // Adjust top padding to account for header
        }}
      >
        {/* Workspace Sidebar - only show if authenticated */}
        {isAuthenticated && (
          <Box
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              height: 'calc(100vh - 64px)', // Subtracting header height
              position: 'fixed',
              top: 64, // Header height
              left: 0,
              zIndex: 10,
              display: { xs: 'none', md: 'block' } // Hide on mobile
            }}
          >
            <WorkspaceSidebar width={SIDEBAR_WIDTH} />
          </Box>
        )}
        
        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            ml: { xs: 0, md: isAuthenticated ? `${SIDEBAR_WIDTH}px` : 0 }, // Add margin on desktop when sidebar is shown
            width: { xs: '100%', md: isAuthenticated ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%' }
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout; 