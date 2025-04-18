"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ltrTheme, rtlTheme } from './theme';
import { useRTL } from '../contexts/RTLContext';

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const { isRTL } = useRTL();
  const [currentTheme, setCurrentTheme] = useState(isRTL ? rtlTheme : ltrTheme);

  useEffect(() => {
    // Update theme when direction changes
    setCurrentTheme(isRTL ? rtlTheme : ltrTheme);
  }, [isRTL]);

  return (
    <MUIThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

export default AppThemeProvider; 