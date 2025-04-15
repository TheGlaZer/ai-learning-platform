import styled from '@emotion/styled';
import { Box, Paper, TextField, Typography, Button } from '@mui/material';
import { primary, secondary, accent, gradients, surface } from '../../../../colors';

export const FormContainer = styled(Paper)`
  padding: 1.75rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  background-color: ${surface.paper};
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${gradients.primaryGradient};
  }
`;

export const FormTitle = styled(Typography)`
  font-weight: 700;
  margin-bottom: 0.75rem;
  background: ${gradients.textGradient};
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
`;

export const FormSubtitle = styled(Typography)`
  text-align: center;
  margin-bottom: 1.25rem;
  color: ${secondary.dark};
`;

export const StyledTextField = styled(TextField)`
  margin-bottom: 1rem;
  
  .MuiOutlinedInput-root {
    border-radius: 6px;
    
    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: ${primary.main};
    }
    
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${primary.main};
      border-width: 2px;
    }
  }
  
  .MuiFormLabel-root.Mui-focused {
    color: ${primary.main};
  }
  
  .MuiFormHelperText-root {
    margin-top: 2px;
    font-size: 0.7rem;
  }
`;

export const SubmitButton = styled(Button)`
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  text-transform: none;
  font-size: 0.9rem;
  background: ${gradients.primaryGradient};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(79, 108, 255, 0.3);
    transform: translateY(-2px);
  }
`;

export const AuthLinks = styled(Box)`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  gap: 0.5rem;
  font-size: 0.85rem;
`;

export const FormDivider = styled(Box)`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${surface.border};
  }
  
  span {
    padding: 0 0.75rem;
    color: ${secondary.dark};
    font-size: 0.8rem;
  }
`;

export const SocialButtonsContainer = styled(Box)`
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
`;

export const SocialButton = styled(Button)`
  border-radius: 6px;
  padding: 0.5rem;
  text-transform: none;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e8e8e8;
    transform: translateY(-1px);
  }
`;

export const PageContainer = styled(Box)`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: ${surface.background};
`;

export const BrandingBox = styled(Box)`
  margin-bottom: 1.5rem;
  text-align: center;
`;

export const FormCircleDecoration = styled(Box)`
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: ${accent.purple.light}08;
  z-index: 0;
`;

export const TopRightDecoration = styled(FormCircleDecoration)`
  top: -100px;
  right: -100px;
`;

export const BottomLeftDecoration = styled(FormCircleDecoration)`
  bottom: -100px;
  left: -100px;
  background: ${accent.green.light}08;
`; 