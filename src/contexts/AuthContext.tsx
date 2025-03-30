"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../app/lib-server/supabaseClient';

// Define types for our auth context
type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  updateAuthState: (accessToken: string | null, refreshToken: string | null, userId: string | null) => void;
  logout: () => Promise<void>;
};

// Create the context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAccessToken(session.access_token);
        setRefreshToken(session.refresh_token);
        setUserId(session.user.id);
        setIsAuthenticated(true);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setAccessToken(session.access_token);
          setRefreshToken(session.refresh_token);
          setUserId(session.user.id);
          setIsAuthenticated(true);
        } else {
          setAccessToken(null);
          setRefreshToken(null);
          setUserId(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to manually update auth state (used from OAuth callback)
  const updateAuthState = (
    newAccessToken: string | null,
    newRefreshToken: string | null,
    newUserId: string | null
  ) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUserId(newUserId);
    setIsAuthenticated(!!newAccessToken && !!newUserId);
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    setIsAuthenticated(false);
  };

  const value = {
    accessToken,
    refreshToken,
    userId,
    isAuthenticated,
    updateAuthState,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};