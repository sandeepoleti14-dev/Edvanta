import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthUser, UserRole } from '../../shared/types';
import { apiFetch, setAuthToken } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    gradeLevel?: string;
  }) => Promise<AuthUser>;
  demoLogin: (role: UserRole) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateLocalUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<{ user: AuthUser }>('/api/auth/me');
        if (active) setUser(res.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; role: UserRole; gradeLevel?: string }) => {
      const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const demoLogin = useCallback(async (role: UserRole) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  const updateLocalUser = useCallback((updated: AuthUser) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
