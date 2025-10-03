'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import type { User, LoginDto, RegisterDto } from '@/types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'microsoft') => Promise<void>;
  setAuthData: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize user from localStorage synchronously to prevent null flash
  const getInitialUser = (): User | null => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          return userData.user || userData;
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          return null;
        }
      }
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getInitialUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Parse and set user data from localStorage first (if not already set)
          const userData = JSON.parse(savedUser);
          const actualUser = userData.user || userData;

          // Only set if user is not already set (to prevent unnecessary re-renders)
          if (!user) {
            setUser(actualUser);
          }

          // Then validate token with backend (optional)
          try {
            const response = await authApi.getProfile();
            if (response.success && response.data) {
              // Update user data if backend returns newer data

              setUser(response.data);
            }
          } catch (error) {
            console.warn('Token validation failed, using cached user data:', error);
            // Keep using cached user data even if validation fails
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginDto) => {
    try {
      const response = await authApi.login(data);

      // Handle new response format with nested data structure
      if (response.success && response.data) {
        const { user, token } = response.data;

        if (user && token) {
          setUser(user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          throw new Error(response.message || 'Login failed - missing user or token');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      const response = await authApi.register(data);

      // Handle new response format with nested data structure
      if (response.success && response.data) {
        const { user, token } = response.data;

        if (user && token) {
          setUser(user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          throw new Error(response.message || 'Registration failed - missing user or token');
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const setAuthData = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const loginWithOAuth = async (provider: 'google' | 'microsoft') => {
    try {
      // Get OAuth URL from backend
      const authUrlResponse = await authApi.getOAuthUrl(provider);
      if (!authUrlResponse.success || !authUrlResponse.data?.authUrl) {
        throw new Error('Failed to get OAuth URL');
      }

      // Redirect to OAuth provider
      window.location.href = authUrlResponse.data.authUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'OAuth login failed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    loginWithOAuth,
    setAuthData,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
