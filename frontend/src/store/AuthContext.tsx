import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loginUser, logoutUser, getCurrentUser } from '../services/api';

// ─── Types ───

export interface AuthUser {
  email: string;
  name: string;
  role: 'admin' | 'employee';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── Token Storage Helpers ───

const TOKEN_KEY = 'talentai_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage not available
  }
}

function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage not available
  }
}

// ─── Provider ───

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true); // true on initial load to check token
  const [error, setError] = useState('');

  const isAuthenticated = !!user && !!token;

  // Check existing token on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
      // Validate token by calling /api/auth/me
      getCurrentUser(storedToken)
        .then((userData) => {
          setUser({
            email: userData.email,
            name: userData.name,
            role: userData.role as 'admin' | 'employee',
          });
        })
        .catch(() => {
          // Token is invalid or expired — clear it
          removeStoredToken();
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await loginUser(email, password);
      const newToken = response.access_token;
      const userData = response.user;

      setStoredToken(newToken);
      setToken(newToken);
      setUser({
        email: userData.email,
        name: userData.name,
        role: userData.role as 'admin' | 'employee',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(message);
      throw err; // Re-throw so the LoginPage can handle it
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
      // Even if server logout fails, clear locally
    } finally {
      removeStoredToken();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
