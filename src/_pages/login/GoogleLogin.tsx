"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Alert, CircularProgress } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '../../app/lib-server/supabaseClient';
import GoogleIcon from '@mui/icons-material/Google';

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
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
            <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleGoogleSignIn}
                sx={{ mt: 0.5, mb: 1 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <GoogleIcon />}
                size="medium"
            >
                {isLoading ? t('connecting') : t('googleLogin')}
            </Button>
        </StyledContainer>
    );
};

export default GoogleLogin;
