"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button, Paper, Container, Stack, CircularProgress } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, refreshSession } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  useEffect(() => {
    // Only run the auth check once when the component mounts
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Delay checking auth status to ensure the refreshSession has time to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Attempt to refresh session
        await refreshSession();
        
        // Add an artificial delay to prevent UI flashing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mounted) {
          setAuthChecked(true);
          // Only show login form after a delay if not authenticated
          if (!isAuthenticated) {
            setTimeout(() => {
              if (mounted && !isAuthenticated) {
                setShowLoginForm(true);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setAuthChecked(true);
          setTimeout(() => {
            if (mounted) {
              setShowLoginForm(true);
            }
          }, 500);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [refreshSession, isAuthenticated]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  // Always show loading until auth is checked
  if (!authChecked || (!isAuthenticated && !showLoginForm)) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  // Only show access denied after auth check is complete AND the delay for showing login form has passed
  if (!isAuthenticated && showLoginForm) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            textAlign: 'center',
            background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <LockIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary.main">
            Access Required
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Please log in or sign up to access the dashboard
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            The AI Learning Platform dashboard gives you access to powerful tools for generating 
            quizzes, managing subjects, and organizing your learning materials.
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mb: 5 }}
          >
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleLogin}
              startIcon={<LoginIcon />}
            >
              Log In
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={handleSignUp}
              startIcon={<HowToRegIcon />}
            >
              Sign Up
            </Button>
          </Stack>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account but having trouble logging in? 
              <Button 
                color="primary" 
                size="small" 
                sx={{ ml: 1, fontWeight: 'medium' }}
                onClick={() => router.push('/forgot-password')}
              >
                Reset Password
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Auth check is complete and user is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard; 