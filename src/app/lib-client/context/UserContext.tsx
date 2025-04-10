'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define user type
interface User {
  id: string;
  email?: string;
  name?: string;
}

// Define the context type
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
}

// Create the context with a default value
export const UserContext = createContext<UserContextType | null>(null);

// Hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Props for the provider
interface UserProviderProps {
  children: ReactNode;
}

// Provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user from local storage on initial mount
  useEffect(() => {
    try {
      setLoading(true);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load user from local storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save user to local storage when it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('Failed to save user to local storage:', err);
    }
  }, [user]);

  // Create the value object to be provided to consumers
  const value = {
    user,
    loading,
    error,
    setUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}; 