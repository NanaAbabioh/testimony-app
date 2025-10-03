'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Authentication Context
 * Provides authentication state and functions throughout the app
 */
const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 * Wraps the application to provide authentication context to all child components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 */
export const AuthProvider = ({ children }) => {
  // Use our custom authentication hook
  const authState = useAuth();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the authentication context
 * Provides easy access to authentication state and functions
 * 
 * @returns {Object} Authentication state and functions
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// Export the context for advanced use cases
export { AuthContext };