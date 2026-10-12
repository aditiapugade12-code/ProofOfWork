import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'student' | 'evaluator';
  status: 'active' | 'deactivated';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  college?: string;
  department?: string;
  branch?: string;
  year?: string;
  rollNumber?: string;
  skills?: string[];
  bio?: string;
  avatarUrl?: string;
  staffId?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  currentView: string;
  setCurrentView: (view: string) => void;
  activeEntityId: string | null;
  setActiveEntityId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid, logging out', err);
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (loginStr: string, passwordStr: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginStr, password: passwordStr }),
      });
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setCurrentView('dashboard');
      setActiveEntityId(null);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setCurrentView('dashboard');
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setCurrentView('dashboard');
    setActiveEntityId(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        currentView,
        setCurrentView,
        activeEntityId,
        setActiveEntityId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
