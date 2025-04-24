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
  SvgIcon,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { primary, secondary, accent, surface, text, gradients, background } from "../../colors";
import { useTranslations } from "next-intl";
import { useRTL } from "@/contexts/RTLContext";

// Custom BarChartOutlined Icon
export const BarChartOutlinedIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24" sx={{ fontSize: 'inherit', transform: 'scale(1.2)' }}>
    <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M3,20v-9h3.5v9H3z M10.25,20V5h3.5v15H10.25z M17.5,20v-12h3.5v12H17.5z" />
  </SvgIcon>
);

const StyledAppBar = styled(AppBar)(() => ({
  backgroundColor: surface.paper,
  color: text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${surface.border}`,
}));

const NavButton = styled(Button)<{ $isSelected?: boolean }>(({ $isSelected }) => ({
  margin: "0 8px",
  textTransform: 'none',
  fontWeight: 500,
  color: $isSelected ? primary.main : text.primary,
  backgroundColor: $isSelected ? background.hover : 'transparent',
  '&:hover': {
    backgroundColor: background.hover,
    color: primary.main,
  },

}));

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, userId, userFullName, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const t = useTranslations('Navigation');
  const { isRTL } = useRTL();
  
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
  
  const navigateToHome = () => {
    router.push('/');
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

  // Check if current path is on a specific page
  const isCurrentPage = (page: string): boolean => {
    if (!pathname) return false;
    
    if (page === '') {
      // For home page, only match exact root path or locale root paths like "/en" or "/he"
      return pathname === '/' || pathname.match(/^\/[a-z]{2}$/) !== null;
    }
    
    // For other pages, check if pathname ends with the page name
    return pathname.endsWith(`/${page}`) || pathname.includes(`/${page}/`);
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        {/* Left: Logo */}
        <Box sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Box mr={isRTL ? 0 : 1} ml={isRTL ? 1 : 0}>
            <Logo width={isMobile ? 36 : 42} height={isMobile ? 36 : 42} variant="auto" />
          </Box>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              ml: isRTL ? 0 : 1,
              mr: isRTL ? 1 : 0,
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' },
              background: gradients.textGradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            AI Learning Platform
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Navigation Links - only show if authenticated and not on mobile */}
        {isAuthenticated && !isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0 }}>
            <NavButton
              dir={isRTL ? 'rtl' : 'ltr'}
              startIcon={<HomeOutlinedIcon />}
              onClick={navigateToHome}
              $isSelected={isCurrentPage('')}
              sx={{
                '& .MuiButton-startIcon': {
                  margin: isRTL ? '0 0 0 8px' : '0 8px 0 0',
                }
              }}
            >
              {t('home')}
            </NavButton>
            <NavButton
              startIcon={<DashboardOutlinedIcon />}
              onClick={navigateToDashboard}
              $isSelected={isCurrentPage('dashboard')}
              sx={{
                '& .MuiButton-startIcon': {
                  margin: isRTL ? '0 0 0 8px' : '0 8px 0 0',
                }
              }}
            >
              {t('dashboard')}
            </NavButton>
            <NavButton
              startIcon={<BarChartOutlinedIcon />}
              onClick={navigateToAnalytics}
              $isSelected={isCurrentPage('analytics')}
              sx={{
                '& .MuiButton-startIcon': {
                  margin: isRTL ? '0 0 0 8px' : '0 8px 0 0',
                }
              }}
            >
              {t('analytics')}
            </NavButton>
          </Box>
        )}

        {/* Right: Avatar with dropdown menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title={isAuthenticated ? "Account settings" : "Login"}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: isRTL ? 0 : 2, mr: isRTL ? 2 : 0 }}
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
                  bgcolor: isAuthenticated ? primary.main : text.disabled,
                  color: text.light
                }}
              >
                {!isAuthenticated && <AccountCircleOutlinedIcon />}
                {isAuthenticated && !userFullName && <AccountCircleOutlinedIcon />}
                {isAuthenticated && userFullName && userFullName.charAt(0).toUpperCase()}
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
                py: 1,
                '&:hover': {
                  backgroundColor: background.hover
                }
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                [isRTL ? 'left' : 'right']: 14,
                width: 10,
                height: 10,
                bgcolor: surface.paper,
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        >
          {isAuthenticated ? (
            <>
              <Box sx={{ 
                px: 2, 
                py: 1.5,
                background: `linear-gradient(135deg, ${primary.light}11, ${accent.purple.light}22)`,
              }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ color: text.primary }}>
                  {userFullName || 'User Profile'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={navigateToHome}>
                <ListItemIcon>
                  <HomeOutlinedIcon fontSize="small" sx={{ color: primary.light }} />
                </ListItemIcon>
                {t('home')}
              </MenuItem>
              <MenuItem onClick={navigateToDashboard}>
                <ListItemIcon>
                  <DashboardOutlinedIcon fontSize="small" sx={{ color: primary.main }} />
                </ListItemIcon>
                {t('dashboard')}
              </MenuItem>
              <MenuItem onClick={navigateToAnalytics}>
                <ListItemIcon>
                  <BarChartOutlinedIcon fontSize="small" sx={{ color: accent.purple.main }} />
                </ListItemIcon>
                {t('analytics')}
              </MenuItem>
              <MenuItem onClick={() => router.push('/profile')}>
                <ListItemIcon>
                  <AccountCircleOutlinedIcon fontSize="small" sx={{ color: accent.green.main }} />
                </ListItemIcon>
                {t('profile')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" sx={{ color: secondary.main }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleLogin}>
              <ListItemIcon>
                <LoginOutlinedIcon fontSize="small" sx={{ color: primary.main }} />
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
