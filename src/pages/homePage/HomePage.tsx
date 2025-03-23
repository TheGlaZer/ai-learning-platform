"use client";
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
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

const HomePage = () => {
    
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      // Redirect to login page or show a success message.
      router.push('/login');
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
          Create Workspace
        </Typography>

      </Box>
    </StyledContainer>
  );
};

export default HomePage;
