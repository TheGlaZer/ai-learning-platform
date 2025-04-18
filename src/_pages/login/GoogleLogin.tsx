"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Alert, CircularProgress, Box } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '../../app/lib-server/supabaseClient';
import GoogleIcon from '@mui/icons-material/Google';

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const GoogleButton = styled(Button)`
  background-color: white;
  color: rgba(0, 0, 0, 0.87);
  border: 1px solid #dadce0;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  text-transform: none;
  font-weight: 500;
  transition: background-color 0.3s, box-shadow 0.3s;
  
  &:hover {
    background-color: #f8f9fa;
    box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
  }
`;

const GoogleLogin = () => {
    const t = useTranslations('LoginPage');
    const locale = useLocale();
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        
        try {
            // Use current locale for the redirect URL
            const redirectUrl = `${window.location.origin}/${locale}/oauth-callback`;
                
            const reponse = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                },
            });
            const { error } = reponse;
            
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
            <GoogleButton
                fullWidth
                onClick={handleGoogleSignIn}
                sx={{ mt: 0.5, mb: 1, py: 1.2 }}
                disabled={isLoading}
                startIcon={
                    isLoading ? 
                    <CircularProgress size={16} color="inherit" /> : 
                    <GoogleIcon sx={{ color: '#4285F4' }} />
                }
                size="medium"
            >
                {isLoading ? t('connecting') : t('googleLogin')}
            </GoogleButton>
        </StyledContainer>
    );
};

export default GoogleLogin;
