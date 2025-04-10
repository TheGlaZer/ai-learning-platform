// src/components/Layout.tsx
"use client";

import React from "react";
import { Box, Container, useTheme } from "@mui/material";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: { xs: 10, sm: 10 }, // Extra padding to account for the fixed header
          pb: 4,
          px: { xs: 2, sm: 4 }
        }}
      >
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
