// src/components/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  ListItemIcon,
  Tooltip,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NavButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0, 1),
  textTransform: 'none',
  fontWeight: 500,
}));

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, userId, logout } = useAuth();
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string>('');
  
  // Get current workspace ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId') || '';
      setWorkspaceId(savedWorkspaceId);
    }
  }, []);
  
  // State for avatar menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };
  
  const handleLogin = () => {
    router.push('/login');
    handleMenuClose();
  };
  
  const navigateToDashboard = () => {
    router.push('/dashboard');
    handleMenuClose();
  };
  
  const navigateToAnalytics = () => {
    router.push('/analytics');
    handleMenuClose();
  };

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
        
        {/* Navigation Links - only show if authenticated and not on mobile */}
        {isAuthenticated && !isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <NavButton
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={navigateToDashboard}
            >
              Dashboard
            </NavButton>
            <NavButton
              color="inherit"
              startIcon={<BarChartIcon />}
              onClick={navigateToAnalytics}
            >
              Analytics
            </NavButton>
          </Box>
        )}

        {/* Right: Avatar with dropdown menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title={isAuthenticated ? "Account settings" : "Login"}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar 
                alt="User Avatar" 
                src={isAuthenticated ? "/static/images/avatar/1.jpg" : undefined}
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: isAuthenticated ? 'primary.main' : 'grey.400'
                }}
              >
                {!isAuthenticated && <AccountCircleIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {isAuthenticated ? (
            <>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  User Profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userId?.substring(0, 8)}...
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={navigateToDashboard}>
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                Dashboard
              </MenuItem>
              <MenuItem onClick={navigateToAnalytics}>
                <ListItemIcon>
                  <BarChartIcon fontSize="small" />
                </ListItemIcon>
                Analytics
              </MenuItem>
              <MenuItem onClick={() => router.push('/profile')}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                Profile Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleLogin}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              Login
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
