"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button, Paper, Container, Stack } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  if (!isAuthenticated) {
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

  return <>{children}</>;
};

export default AuthGuard; 