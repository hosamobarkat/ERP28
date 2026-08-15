import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiFetch } from '../api/client';

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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('weaving_erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('weaving_erp_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      apiFetch('/api/auth/me')
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('weaving_erp_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('weaving_erp_token', newToken);
    localStorage.setItem('weaving_erp_user', JSON.stringify(newUser));
    setLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('weaving_erp_token');
    localStorage.removeItem('weaving_erp_user');
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
