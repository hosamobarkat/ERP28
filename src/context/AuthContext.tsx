import React, { createContext, useContext, useState } from 'react';
import { User, UserRole, WarehouseUserRole, AppModule } from '../types';
import { setAuthToken } from '../api/client';

interface AuthContextType {
  // Common Module State
  currentModule: AppModule;
  setCurrentModule: (module: AppModule) => void;
  
  // Weaving Production Auth
  productionUser: User | null;
  productionToken: string | null;
  isProductionAuthenticated: boolean;
  isManager: boolean;
  isCoordinator: boolean;
  isHallManager: boolean;
  canEditLoom: boolean;
  canDeleteRecords: boolean;
  loginProduction: (token: string, user: User) => void;
  logoutProduction: () => void;
  hasProductionRole: (...roles: UserRole[]) => boolean;

  // Yarn Warehouse Auth
  warehouseRole: WarehouseUserRole | null;
  isWarehouseAuthenticated: boolean;
  loginWarehouse: (role: WarehouseUserRole) => void;
  logoutWarehouse: () => void;

  // Generic helpers for backwards compatibility
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start with 'gateway' and null credentials upon opening link or refreshing page
  const [currentModule, setCurrentModule] = useState<AppModule>('gateway');
  
  // Production State
  const [productionUser, setProductionUser] = useState<User | null>(null);
  const [productionToken, setProductionToken] = useState<string | null>(null);

  // Warehouse State
  const [warehouseRole, setWarehouseRole] = useState<WarehouseUserRole | null>(null);

  const loginProduction = (newToken: string, newUser: User) => {
    setProductionToken(newToken);
    setProductionUser(newUser);
    setAuthToken(newToken);
    setCurrentModule('production');
  };

  const logoutProduction = () => {
    setProductionToken(null);
    setProductionUser(null);
    setAuthToken(null);
    try {
      sessionStorage.removeItem('weaving_erp_token');
      sessionStorage.removeItem('weaving_erp_user');
      localStorage.removeItem('weaving_erp_token');
      localStorage.removeItem('weaving_erp_user');
    } catch {}
    setCurrentModule('gateway');
  };

  const hasProductionRole = (...roles: UserRole[]): boolean => {
    if (!productionUser) return false;
    return roles.includes(productionUser.role);
  };

  const loginWarehouse = (role: WarehouseUserRole) => {
    setWarehouseRole(role);
    setCurrentModule('yarn-warehouse');
  };

  const logoutWarehouse = () => {
    setWarehouseRole(null);
    setCurrentModule('gateway');
  };

  const logout = () => {
    logoutProduction();
    logoutWarehouse();
    setCurrentModule('gateway');
  };

  const isProductionAuthenticated = !!productionUser && !!productionToken;
  const isWarehouseAuthenticated = !!warehouseRole;

  const isManager = productionUser?.role === 'manager' || productionUser?.role === 'admin';
  const isCoordinator = productionUser?.role === 'coordinator';
  const isHallManager = productionUser?.role === 'hall_manager';

  const canEditLoom = isManager || isCoordinator;
  const canDeleteRecords = isManager;

  return (
    <AuthContext.Provider
      value={{
        currentModule,
        setCurrentModule,

        productionUser,
        productionToken,
        isProductionAuthenticated,
        isManager,
        isCoordinator,
        isHallManager,
        canEditLoom,
        canDeleteRecords,
        loginProduction,
        logoutProduction,
        hasProductionRole,

        warehouseRole,
        isWarehouseAuthenticated,
        loginWarehouse,
        logoutWarehouse,

        // Backwards compatibility alias for production views
        user: productionUser,
        token: productionToken,
        isAuthenticated: isProductionAuthenticated,
        login: loginProduction,
        logout: logoutProduction,
        hasRole: hasProductionRole,
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
