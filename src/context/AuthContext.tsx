import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { setAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isCoordinator: boolean;
  isHallManager: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canEditLoom: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canDeleteRecords: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start with null user and token so login is required on initial link open and upon refresh
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    setLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem('weaving_erp_token');
      localStorage.removeItem('weaving_erp_user');
    } catch {}
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAuthenticated = !!user && !!token;
  const isManager = user?.role === 'manager';
  const isCoordinator = user?.role === 'coordinator';
  const isHallManager = user?.role === 'hall_manager';

  const canEditLoom = hasRole('manager', 'coordinator');
  const canManageOrders = hasRole('manager', 'coordinator');
  const canManageUsers = hasRole('manager');
  const canDeleteRecords = hasRole('manager');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isManager,
        isCoordinator,
        isHallManager,
        loading,
        login,
        logout,
        hasRole,
        canEditLoom,
        canManageOrders,
        canManageUsers,
        canDeleteRecords,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

