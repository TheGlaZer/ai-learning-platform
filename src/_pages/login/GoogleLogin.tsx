"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Box, Typography, Alert, CircularProgress } from '@mui/material';
import styled from '@emotion/styled';
import { supabase } from '../../app/lib-server/supabaseClient';
import GoogleIcon from '@mui/icons-material/Google';
import { getCurrentOrigin } from '@/app/utils/getCurrentOrigin';

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const GoogleLogin = () => {
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        
        try {
            // Simply use window.location.origin which will be correct in both environments
            const redirectUrl = `${window.location.origin}/he/oauth-callback`;
                
            const reponse = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                },
            });
            const { error } = reponse;
            console.log("response => ", reponse);

            if (error) {
                setErrorMsg(error.message);
                setIsLoading(false); // Reset loading state on error
            }
            // If successful, Supabase will redirect to the callback URL
            // No need to reset loading state here as we're redirecting away
        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred during Google login');
            setIsLoading(false);
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
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
            >
                {isLoading ? 'Connecting...' : 'Sign in with Google'}
            </Button>
        </StyledContainer>
    );
};

export default GoogleLogin;
