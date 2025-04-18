"use client";

import React from 'react';
import { RTLProvider } from '@/contexts/RTLContext';

interface LocaleProvidersProps {
  children: React.ReactNode;
}

export function LocaleProviders({ children }: LocaleProvidersProps) {
  return (
    <RTLProvider>
      {children}
    </RTLProvider>
  );
} 