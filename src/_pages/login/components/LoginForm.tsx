"use client";
import React from 'react';
import { Box, Alert, CircularProgress, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { LoginFormInputs, useLogin } from '../../../hooks/useLogin';
import GoogleLogin from '../GoogleLogin';
import { 
  FormContainer, 
  FormTitle, 
  FormSubtitle, 
  StyledTextField, 
  SubmitButton, 
  AuthLinks,
  FormDivider,
  TopRightDecoration,
  BottomLeftDecoration,
  ForgotPasswordLink
} from './StyledComponents';
import { useRTL } from '@/contexts/RTLContext';

const LoginForm: React.FC = () => {
  const t = useTranslations('LoginPage');
  const { isRTL } = useRTL();
  const { 
    register, 
    handleSubmit, 
    errors, 
    errorMsg, 
    isLoading, 
    onSubmit 
  } = useLogin();
  
  const [showPassword, setShowPassword] = React.useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormContainer>
      <TopRightDecoration />
      <BottomLeftDecoration />
      
      <Box position="relative" zIndex={1} sx={{ textAlign: isRTL ? 'right' : 'left' }}>
        <FormTitle variant="h5">{t('formTitle')}</FormTitle>
        <FormSubtitle variant="body2">
          {t('formSubtitle')}
        </FormSubtitle>
        
        {errorMsg && <Alert severity="error" sx={{ mb: 1.5 }}>{errorMsg}</Alert>}
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          <StyledTextField
            label={t('emailLabel')}
            variant="outlined"
            fullWidth
            size="small"
            type="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="primary" fontSize="small" />
                </InputAdornment>
              ),
            }}
            {...register('email', { 
              required: t('emailRequired'),
              pattern: { 
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                message: t('emailInvalid') 
              } 
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          <StyledTextField
            label={t('passwordLabel')}
            variant="outlined"
            fullWidth
            size="small"
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('password', { 
              required: t('passwordRequired')
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          <ForgotPasswordLink sx={{ textAlign: isRTL ? 'left' : 'right' }}>
            <NextLink href="/forgot-password" passHref>
              <MuiLink>{t('forgotPassword')}</MuiLink>
            </NextLink>
          </ForgotPasswordLink>
          
          <SubmitButton 
            type="submit" 
            variant="contained" 
            fullWidth 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
            size="medium"
          >
            {isLoading ? t('loggingIn') : t('login')}
          </SubmitButton>
        </form>
        
        <FormDivider>
          <span>{t('orDivider')}</span>
        </FormDivider>
        
        <GoogleLogin />
        
        <AuthLinks>
          <span>{t('newUser')}</span>
          <NextLink href="/signup" passHref>
            <MuiLink fontWeight="600" color="primary.main">{t('signupLink')}</MuiLink>
          </NextLink>
        </AuthLinks>
      </Box>
    </FormContainer>
  );
};

export default LoginForm; 