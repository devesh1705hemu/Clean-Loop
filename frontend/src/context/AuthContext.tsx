'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/types';
import { cognitoAuth, AuthSession } from '@/lib/cognito';

interface AuthContextType {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<AuthSession>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize to null initially to guarantee matching SSR and client hydration HTML
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from client storage after mount
  React.useEffect(() => {
    const session = cognitoAuth.getCurrentSession();
    if (session) {
      setUser(session);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole = 'STUDENT') => {
    setIsLoading(true);
    try {
      const session = await cognitoAuth.signIn(email, password, role);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      await cognitoAuth.signUp(email, password, role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    cognitoAuth.signOut();
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const updated = cognitoAuth.switchSessionRole(newRole);
    if (updated) {
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
