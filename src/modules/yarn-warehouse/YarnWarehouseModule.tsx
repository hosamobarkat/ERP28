import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Sidebar, ActiveTab } from '../../components/Sidebar';
import { Dashboard } from '../../components/Dashboard';
import { PurchasesView } from '../../components/PurchasesView';
import { WarehouseView } from '../../components/WarehouseView';
import { WithdrawalsView } from '../../components/WithdrawalsView';
import { MovementsLedgerView } from '../../components/MovementsLedgerView';
import { PurchaseRecommendationsView } from '../../components/PurchaseRecommendationsView';
import { AuditLogView } from '../../components/AuditLogView';
import { BackupRestoreView } from '../../components/BackupRestoreView';
import { GlobalSearchModal } from '../../components/GlobalSearchModal';
import { AuthModal } from '../../components/AuthModal';

import { storageService } from '../../services/storageService';
import { calculatePOTolerance } from '../../utils/poUtils';
import { useAuth } from '../../context/AuthContext';
import { 
  WarehouseUserRole, 
  USER_ACCOUNTS,
  PurchaseOrderItem, 
  WarehouseStockItem, 
  Withdrawal, 
  InventoryMovement, 
  SystemNotification,
  AuditLog 
} from '../../types';

export const YarnWarehouseModule: React.FC = () => {
  const { warehouseRole, loginWarehouse, logoutWarehouse, setCurrentModule } = useAuth();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<WarehouseUserRole>(warehouseRole || 'admin');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // App State synced with storageService
  const [purchases, setPurchases] = useState<PurchaseOrderItem[]>([]);
  const [stock, setStock] = useState<WarehouseStockItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = () => {
    setPurchases(storageService.getPurchaseOrders());
    setStock(storageService.getWarehouseStock());
    setWithdrawals(storageService.getWithdrawals());
    setMovements(storageService.getMovements());
    setNotifications(storageService.getNotifications());
    setAuditLogs(storageService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (warehouseRole) {
      setCurrentRole(warehouseRole);
    }
  }, [warehouseRole]);

  const handleAuthenticateRole = (role: WarehouseUserRole) => {
    setCurrentRole(role);
    loginWarehouse(role);
    const acc = USER_ACCOUNTS[role];
    storageService.logAudit(acc.name, role, 'تسجيل دخول', `تم تسجيل الدخول بنجاح لحساب ${acc.title}`);
    setIsAuthModalOpen(false);
  };

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derived counts
  const lowStockCount = stock.filter(s => s.netWeightKg <= s.minStockKg).length;
  const pendingPoCount = purchases.filter(p => calculatePOTolerance(p.totalRequiredWeightKg, p.receivedWeightKg).pendingWeightKg > 0).length;

  return (
    <div className={`min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200`} dir="rtl">
      
      {/* Top Navigation Header */}
      <Header
        currentRole={currentRole}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notifications={notifications}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onSwitchToProduction={() => setCurrentModule('production')}
        onLogout={logoutWarehouse}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
          pendingPoCount={pendingPoCount}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onSwitchToProduction={() => setCurrentModule('production')}
          onLogout={logoutWarehouse}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden min-w-0 p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              purchases={purchases}
              stock={stock}
              withdrawals={withdrawals}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              userRole={currentRole}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'warehouse' && (
            <WarehouseView
              stock={stock}
              userRole={currentRole}
              searchQuery={searchQuery}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'withdrawals' && (
            <WithdrawalsView
              withdrawals={withdrawals}
              stock={stock}
              userRole={currentRole}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'movements' && (
            <MovementsLedgerView
              movements={movements}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'recommendations' && (
            <PurchaseRecommendationsView
              userRole={currentRole}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView logs={auditLogs} />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreView
              userRole={currentRole}
              userName={USER_ACCOUNTS[currentRole]?.name || 'مدير النظام'}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
        </main>

      </div>

      {/* Global Search Modal Overlay */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        purchases={purchases}
        stock={stock}
        withdrawals={withdrawals}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Account Authentication Modal Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        onAuthenticate={handleAuthenticateRole}
        isMandatoryLogin={false}
      />

    </div>
  );
};
