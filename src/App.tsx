import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { HallsView } from './views/HallsView';
import { LoomGroupsView } from './views/LoomGroupsView';
import { LoomsView } from './views/LoomsView';
import { FabricItemsView } from './views/FabricItemsView';
import { ProductionOrdersView } from './views/ProductionOrdersView';
import { ProductionEntryView } from './views/ProductionEntryView';
import { LoomStoppagesView } from './views/LoomStoppagesView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';

import { apiFetch } from './api/client';
import { Hall, LoomGroup, Loom, FabricItem, ProductionOrder, ProductionEntry, LoomStoppage, User, AppNotification } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // System Data States
  const [halls, setHalls] = useState<Hall[]>([]);
  const [groups, setGroups] = useState<LoomGroup[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [stoppages, setStoppages] = useState<LoomStoppage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchAllData = async () => {
    if (!isAuthenticated) return;
    setDataLoading(true);
    try {
      const [
        hallsRes,
        groupsRes,
        loomsRes,
        fabricsRes,
        ordersRes,
        entriesRes,
        stoppagesRes,
        usersRes,
        notifsRes,
      ] = await Promise.all([
        apiFetch('/api/halls').catch(() => []),
        apiFetch('/api/loom-groups').catch(() => []),
        apiFetch('/api/looms').catch(() => []),
        apiFetch('/api/fabric-items').catch(() => []),
        apiFetch('/api/production-orders').catch(() => []),
        apiFetch('/api/production-entries').catch(() => []),
        apiFetch('/api/stoppages').catch(() => []),
        apiFetch('/api/users').catch(() => []),
        apiFetch('/api/notifications').catch(() => []),
      ]);

      setHalls(Array.isArray(hallsRes) ? hallsRes : []);
      setGroups(Array.isArray(groupsRes) ? groupsRes : []);
      setLooms(Array.isArray(loomsRes) ? loomsRes : []);
      setFabrics(Array.isArray(fabricsRes) ? fabricsRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setEntries(Array.isArray(entriesRes) ? entriesRes : []);
      setStoppages(Array.isArray(stoppagesRes) ? stoppagesRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setNotifications(Array.isArray(notifsRes) ? notifsRes : []);
    } catch (err) {
      console.error('Data Fetch Error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white dir-rtl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">جاري تحميل نظام ERP قسم النسيج...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const stoppedLoomsCount = (Array.isArray(looms) ? looms : []).filter((l) => l.status === 'stopped' || l.status === 'maintenance').length;
  const delayedOrdersCount = (Array.isArray(orders) ? orders : []).filter((o) => o.status === 'delayed').length;
  const activeNotifsCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.isRead).length
    : stoppedLoomsCount + delayedOrdersCount;

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen dir-rtl font-sans transition-colors duration-200`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        stoppedLoomsCount={stoppedLoomsCount}
        delayedOrdersCount={delayedOrdersCount}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col pt-20 ${collapsed ? 'mr-20' : 'mr-72'}`}>
        <TopBar
          collapsed={collapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSearch={setSearchTerm}
          searchTerm={searchTerm}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          notificationsCount={activeNotifsCount}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {dataLoading && (
            <div className="mb-4 p-2 bg-indigo-500/10 text-indigo-400 text-xs rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>جاري تحديث وتزامن بيانات النظام...</span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              looms={looms}
              orders={orders}
              entries={entries}
              stoppages={stoppages}
              onNavigateTab={(tab: any) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'halls' && <HallsView halls={halls} onRefresh={fetchAllData} />}

          {activeTab === 'groups' && <LoomGroupsView groups={groups} halls={halls} onRefresh={fetchAllData} />}

          {activeTab === 'looms' && (
            <LoomsView looms={looms} halls={halls} groups={groups} onRefresh={fetchAllData} />
          )}

          {activeTab === 'fabrics' && <FabricItemsView fabrics={fabrics} onRefresh={fetchAllData} />}

          {activeTab === 'orders' && (
            <ProductionOrdersView
              orders={orders}
              fabrics={fabrics}
              halls={halls}
              looms={looms}
              onRefresh={fetchAllData}
            />
          )}

          {(activeTab === 'entry' || (activeTab as string) === 'entries') && (
            <ProductionEntryView
              entries={entries}
              looms={looms}
              orders={orders}
              fabrics={fabrics}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'stoppages' && (
            <LoomStoppagesView stoppages={stoppages} looms={looms} onRefresh={fetchAllData} />
          )}

          {(activeTab === 'monitoring' || (activeTab as string) === 'live') && (
            <LiveMonitoringView
              looms={looms}
              halls={halls}
              orders={orders}
              fabrics={fabrics}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              entries={entries}
              halls={halls}
              looms={looms}
              fabrics={fabrics}
              orders={orders}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={users}
              halls={halls}
              onRefresh={fetchAllData}
              onOpenChangePassword={() => setIsPasswordModalOpen(true)}
            />
          )}

          {activeTab === 'audit' && <AuditLogView />}

          {activeTab === 'settings' && <SettingsView onRefresh={fetchAllData} />}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        looms={looms}
        orders={orders}
        onSelectTab={(tab: any) => setActiveTab(tab)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
