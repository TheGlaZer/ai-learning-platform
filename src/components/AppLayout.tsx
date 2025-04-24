'use client';

import React, { ReactNode, useState } from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import WorkspaceSidebar from './WorkspaceSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRTL } from '@/contexts/RTLContext';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const { isRTL } = useRTL();
  
  const SIDEBAR_WIDTH = 250;
  const MINIMIZED_SIDEBAR_WIDTH = 60;
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  
  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarMinimized(collapsed);
  };
  
  const currentSidebarWidth = isSidebarMinimized ? MINIMIZED_SIDEBAR_WIDTH : SIDEBAR_WIDTH;
  
  // Add a constant for the transition timing to keep animations in sync
  const TRANSITION_DURATION = '0.3s';
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      overflow: 'visible'
    }}>
      <Header />
      
      <Box 
        component="main" 
        sx={{ 
          display: 'flex',
          flexGrow: 1,
          pt: { xs: 7, sm: 6 }, // Adjust top padding to account for header
          overflow: 'visible', // Ensure nothing gets clipped
          position: 'relative', // Establish a positioning context
        }}
      >
        {/* Workspace Sidebar - only show if authenticated */}
        {isAuthenticated && (
          <Box
            sx={{
              width: currentSidebarWidth,
              flexShrink: 0,
              height: 'calc(100vh - 64px)', // Subtracting header height
              position: 'fixed',
              top: 64, // Header height
              [isRTL ? 'right' : 'left']: 0, // Position based on RTL
              zIndex: 1000,
              display: { xs: 'none', md: 'block' }, // Hide on mobile
              overflow: 'visible', // Ensure the toggle button is not clipped
              transition: `width ${TRANSITION_DURATION} ease`, // Add transition for width changes
              borderLeft: isRTL ? `1px solid ${theme.palette.divider}` : 'none',
              borderRight: isRTL ? 'none' : `1px solid ${theme.palette.divider}`,
              // Ensure enough space for the toggle button in RTL mode
              paddingLeft: isRTL ? '16px' : 0,
            }}
          >
            <WorkspaceSidebar 
              width={SIDEBAR_WIDTH} 
              onToggleCollapse={handleSidebarToggle}
            />
          </Box>
        )}
        
        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            [isRTL ? 'pr' : 'pl']: {sm: 2, md: 2},
            [isRTL ? 'mr' : 'ml']: { 
              xs: 0, 
              md: isAuthenticated ? `${currentSidebarWidth}px` : 0 
            }, // Add margin based on current sidebar width
            width: { xs: '100%', md: "auto"},
            border: "none",
            transition: `all ${TRANSITION_DURATION} ease`, // Synchronized with sidebar transition
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout; 