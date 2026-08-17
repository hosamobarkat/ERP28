import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UnifiedGateway } from './modules/gateway/UnifiedGateway';
import { ProductionModule } from './modules/production/ProductionModule';
import { YarnWarehouseModule } from './modules/yarn-warehouse/YarnWarehouseModule';

function AppContent() {
  const { currentModule, isProductionAuthenticated, isWarehouseAuthenticated } = useAuth();

  if (currentModule === 'production' && isProductionAuthenticated) {
    return <ProductionModule />;
  }

  if (currentModule === 'yarn-warehouse' && isWarehouseAuthenticated) {
    return <YarnWarehouseModule />;
  }

  // Default Entry Gateway for new visitors or upon page refresh
  return <UnifiedGateway />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
