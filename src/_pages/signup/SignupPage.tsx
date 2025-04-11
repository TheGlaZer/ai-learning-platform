"use client";
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Container, Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { supabase } from '../../app/lib-server/supabaseClient';

interface SignUpFormInputs {
  email: string;
  password: string;
}

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
`;

const SignUpPage = () => {
    
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormInputs>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        // If email confirmation is required
        if (authData?.user?.identities?.length === 0) {
          setSuccessMsg('Registration successful! Please check your email to confirm your account before logging in.');
          // Wait 3 seconds before redirecting to login
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          // If email confirmation is not required, auto-login and redirect to dashboard
          setSuccessMsg('Registration successful! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <Box
        sx={{
          pt: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 3,
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        {successMsg && <Alert severity="success">{successMsg}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            {...register('email', { required: 'Email is required' })}
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : ''}
            disabled={isLoading || !!successMsg}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : ''}
            disabled={isLoading || !!successMsg}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={isLoading || !!successMsg}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>
      </Box>
    </StyledContainer>
  );
};

export default SignUpPage;
