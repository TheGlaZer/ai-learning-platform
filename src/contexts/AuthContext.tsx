"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../app/lib-server/supabaseClient';

// Define types for our auth context
type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userFullName: string | null;
  isAuthenticated: boolean;
  updateAuthState: (accessToken: string | null, refreshToken: string | null, userId: string | null) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
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
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Refresh session function
  const refreshSession = async (): Promise<boolean> => {
    try {
      // If there's no refresh token, we can't refresh the session
      if (!refreshToken) {
        console.log('No refresh token available - unable to refresh session');
        return false;
      }
      
      // Don't refresh more often than every 5 minutes to avoid excessive calls
      const now = Date.now();
      if (now - lastRefreshTime < 5 * 60 * 1000) {
        return isAuthenticated;
      }
      
      console.log('Attempting to refresh authentication session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      console.log('Session refreshed successfully');
      setAccessToken(data.session.access_token);
      setRefreshToken(data.session.refresh_token);
      setUserId(data.session.user.id);
      setUserFullName(data.session.user.user_metadata?.full_name || null);
      setIsAuthenticated(true);
      setLastRefreshTime(now);
      
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAccessToken(session.access_token);
        setRefreshToken(session.refresh_token);
        setUserId(session.user.id);
        setUserFullName(session.user.user_metadata?.full_name || null);
        setIsAuthenticated(true);
        setLastRefreshTime(Date.now());
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
          setUserFullName(session.user.user_metadata?.full_name || null);
          setIsAuthenticated(true);
          setLastRefreshTime(Date.now());
        } else {
          setAccessToken(null);
          setRefreshToken(null);
          setUserId(null);
          setUserFullName(null);
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
    if (newAccessToken) {
      setLastRefreshTime(Date.now());
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    setUserFullName(null);
    setIsAuthenticated(false);
  };

  const value = {
    accessToken,
    refreshToken,
    userId,
    userFullName,
    isAuthenticated,
    updateAuthState,
    logout,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// This component is exported without "use client" directive
// and can be imported by server components
export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}