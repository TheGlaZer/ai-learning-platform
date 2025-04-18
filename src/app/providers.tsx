"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/app/lib-client/context/UserContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <UserProvider>
          <WorkspaceProvider>
            <AppThemeProvider>
              {children}
            </AppThemeProvider>
          </WorkspaceProvider>
        </UserProvider>
      </AuthProvider>
    </QueryProvider>
  );
} 