"use client"
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Container, Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { supabase } from '../../app/lib-server/supabaseClient';
import GoogleLogin from './GoogleLogin';

interface LoginFormInputs {
  email: string;
  password: string;
}

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
`;

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const reponse = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      const {error} = reponse;
      console.log("response => ", reponse);
      
      if (error) {
        setErrorMsg(error.message);
      } else {
        // Redirect to dashboard after successful login
        router.push('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <Box
        sx={{
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
          Login
        </Typography>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            {...register('email', { required: 'Email is requlaired' })}
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : ''}
            disabled={isLoading}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            {...register('password', { required: 'Password is required' })}
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : ''}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <GoogleLogin />
        </form>
      </Box>
    </StyledContainer>
  );
};

export default LoginPage;
