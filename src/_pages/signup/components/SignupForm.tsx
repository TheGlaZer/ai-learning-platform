"use client";
import React from 'react';
import { Box, Alert, CircularProgress, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Person, Email, Lock } from '@mui/icons-material';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { SignUpFormInputs, useSignup } from '../../../hooks/useSignup';
import GoogleLogin from '../../login/GoogleLogin';
import { 
  FormContainer, 
  FormTitle, 
  FormSubtitle, 
  StyledTextField, 
  SubmitButton, 
  AuthLinks,
  FormDivider,
  TopRightDecoration,
  BottomLeftDecoration
} from './StyledComponents';

const SignupForm: React.FC = () => {
  const t = useTranslations('SignupPage');
  const { 
    register, 
    handleSubmit, 
    watch,
    errors, 
    errorMsg, 
    isLoading, 
    successMsg, 
    onSubmit 
  } = useSignup();
  
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const password = watch('password');
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <FormContainer>
      <TopRightDecoration />
      <BottomLeftDecoration />
      
      <Box position="relative" zIndex={1}>
        <FormTitle variant="h5">{t('formTitle')}</FormTitle>
        <FormSubtitle variant="body2">
          {t('formSubtitle')}
        </FormSubtitle>
        
        {errorMsg && <Alert severity="error" sx={{ mb: 1.5 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 1.5 }}>{successMsg}</Alert>}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <StyledTextField
            label={t('fullNameLabel')}
            variant="outlined"
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="primary" fontSize="small" />
                </InputAdornment>
              ),
            }}
            {...register('fullName', { 
              required: t('fullNameRequired'),
              minLength: { value: 2, message: t('fullNameTooShort') }
            })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            disabled={isLoading || !!successMsg}
          />
          
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
            disabled={isLoading || !!successMsg}
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
              required: t('passwordRequired'),
              minLength: { value: 6, message: t('passwordTooShort') }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading || !!successMsg}
          />
          
          <StyledTextField
            label={t('confirmPasswordLabel')}
            variant="outlined"
            fullWidth
            size="small"
            type={showConfirmPassword ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="primary" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('confirmPassword', { 
              required: t('confirmPasswordRequired'),
              validate: value => value === password || t('passwordsDoNotMatch')
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={isLoading || !!successMsg}
          />
          
          <SubmitButton 
            type="submit" 
            variant="contained" 
            fullWidth 
            disabled={isLoading || !!successMsg}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
            size="medium"
          >
            {isLoading ? t('creatingAccount') : t('createAccount')}
          </SubmitButton>
        </form>
        
        <FormDivider>
          <span>{t('orDivider')}</span>
        </FormDivider>
        
        <GoogleLogin />
        
        <AuthLinks>
          <span>{t('alreadyHaveAccount')}</span>
          <NextLink href="/login" passHref>
            <MuiLink fontWeight="600" color="primary.main">{t('loginLink')}</MuiLink>
          </NextLink>
        </AuthLinks>
      </Box>
    </FormContainer>
  );
};

export default SignupForm; 