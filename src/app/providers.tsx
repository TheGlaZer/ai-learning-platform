"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/app/lib-client/context/UserContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </UserProvider>
    </AuthProvider>
  );
} 