import React, { useState, useEffect } from 'react';
import { ProductionSidebar } from './components/ProductionSidebar';
import { TopBar } from './components/TopBar';
import { NotificationDrawer } from '../../components/NotificationDrawer';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

import { DashboardView } from '../../views/DashboardView';
import { HallsView } from '../../views/HallsView';
import { LoomGroupsView } from '../../views/LoomGroupsView';
import { LoomsView } from '../../views/LoomsView';
import { FabricItemsView } from '../../views/FabricItemsView';
import { ProductionOrdersView } from '../../views/ProductionOrdersView';
import { ProductionEntryView } from '../../views/ProductionEntryView';
import { LoomStoppagesView } from '../../views/LoomStoppagesView';
import { LiveMonitoringView } from '../../views/LiveMonitoringView';
import { ReportsView } from '../../views/ReportsView';
import { UsersView } from '../../views/UsersView';
import { AuditLogView } from '../../views/AuditLogView';
import { SettingsView } from '../../views/SettingsView';

import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  ProductionNavTab,
  Hall,
  LoomGroup,
  Loom,
  FabricItem,
  ProductionOrder,
  ProductionEntry,
  LoomStoppage,
  AuditLog,
  SystemSettings,
} from '../../types';

export const ProductionModule: React.FC = () => {
  const { setCurrentModule, isWarehouseAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ProductionNavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Production State Data
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loomGroups, setLoomGroups] = useState<LoomGroup[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [stoppages, setStoppages] = useState<LoomStoppage[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        hallsData,
        groupsData,
        loomsData,
        fabricsData,
        ordersData,
        entriesData,
        stoppagesData,
        usersData,
        auditLogsData,
      ] = await Promise.all([
        apiFetch<Hall[]>('/api/halls').catch(() => []),
        apiFetch<LoomGroup[]>('/api/loom-groups').catch(() => []),
        apiFetch<Loom[]>('/api/looms').catch(() => []),
        apiFetch<FabricItem[]>('/api/fabric-items').catch(() => []),
        apiFetch<ProductionOrder[]>('/api/production-orders').catch(() => []),
        apiFetch<ProductionEntry[]>('/api/production-entries').catch(() => []),
        apiFetch<LoomStoppage[]>('/api/loom-stoppages').catch(() => []),
        apiFetch<any[]>('/api/users').catch(() => []),
        apiFetch<AuditLog[]>('/api/audit-logs').catch(() => []),
      ]);

      setHalls(hallsData || []);
      setLoomGroups(groupsData || []);
      setLooms(loomsData || []);
      setFabrics(fabricsData || []);
      setOrders(ordersData || []);
      setEntries(entriesData || []);
      setStoppages(stoppagesData || []);
      setUsers(usersData || []);
      setAuditLogs(auditLogsData || []);
    } catch (err) {
      console.error('Error fetching production data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSwitchToWarehouse = () => {
    if (isWarehouseAuthenticated) {
      setCurrentModule('yarn-warehouse');
    } else {
      setCurrentModule('yarn-warehouse');
    }
  };

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Notifications calculation
  const notificationsCount =
    looms.filter((l) => l.status === 'stopped' || l.status === 'maintenance').length +
    orders.filter((o) => o.status === 'delayed').length;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200`} dir="rtl">
      {/* Top Header */}
      <TopBar
        collapsed={sidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        notificationsCount={notificationsCount}
        onToggleNotifications={() => setIsNotifDrawerOpen(!isNotifDrawerOpen)}
        onSwitchToWarehouse={handleSwitchToWarehouse}
      />

      {/* Production Sidebar */}
      <ProductionSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onSwitchToWarehouse={handleSwitchToWarehouse}
      />

      {/* Main Content Area */}
      <main
        className={`pt-24 pb-12 px-4 sm:px-6 transition-all duration-300 ${
          sidebarCollapsed ? 'mr-20' : 'mr-72'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              looms={looms}
              orders={orders}
              entries={entries}
              stoppages={stoppages}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'halls' && (
            <HallsView
              halls={halls}
              looms={looms}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'groups' && (
            <LoomGroupsView
              groups={loomGroups}
              halls={halls}
              looms={looms}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'looms' && (
            <LoomsView
              looms={looms}
              halls={halls}
              groups={loomGroups}
              fabrics={fabrics}
              searchTerm={searchTerm}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'fabrics' && (
            <FabricItemsView
              fabrics={fabrics}
              searchTerm={searchTerm}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'orders' && (
            <ProductionOrdersView
              orders={orders}
              fabrics={fabrics}
              halls={halls}
              looms={looms}
              searchTerm={searchTerm}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'entry' && (
            <ProductionEntryView
              entries={entries}
              looms={looms}
              orders={orders}
              fabrics={fabrics}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'stoppages' && (
            <LoomStoppagesView
              stoppages={stoppages}
              looms={looms}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'monitoring' && (
            <LiveMonitoringView
              looms={looms}
              halls={halls}
              orders={orders}
              fabrics={fabrics}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              entries={entries || []}
              stoppages={stoppages || []}
              looms={looms || []}
              halls={halls || []}
              orders={orders || []}
              fabrics={fabrics || []}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={users || []}
              halls={halls || []}
              onRefresh={loadAllData}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView logs={auditLogs || []} />
          )}

          {activeTab === 'settings' && (
            <SettingsView onRefresh={loadAllData} />
          )}
        </div>
      </main>

      {/* Notification Drawer Overlay */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        looms={looms}
        orders={orders}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsNotifDrawerOpen(false);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
