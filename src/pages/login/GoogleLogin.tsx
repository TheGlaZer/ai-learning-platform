"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Box, Typography, Alert } from '@mui/material';
import styled from 'styled-components';
import { supabase } from '../../app/lib/supabaseClient';

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const GoogleLogin = () => {
    const router = useRouter();
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Optionally specify redirect URL if not using the default one set in Supabase.
                redirectTo: 'http://localhost:3000/he/oauth-callback'
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            // Supabase will handle the redirect; you can also show a loader if needed.
            setErrorMsg(null);
        }
    };

    return (
        <StyledContainer maxWidth="sm">
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleGoogleSignIn}
                sx={{ mt: 2 }}
            >
                Sign in with Google
            </Button>
        </StyledContainer>
    );
};

export default GoogleLogin;
