"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Logo from "./Logo";
import { useRouter } from "next/navigation";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SimpleHeader: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        {/* Left: Logo */}
        <Box sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Box mr={1}>
            <Logo width={isMobile ? 36 : 42} height={isMobile ? 36 : 42} variant="auto" />
          </Box>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              ml: 1, 
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            AI Learning Platform
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right: Navigation links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button color="inherit" onClick={() => router.push('/login')}>
            Log In
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </Button>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default SimpleHeader; 