import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Grid2X2,
  Cpu,
  Layers,
  ClipboardList,
  PenTool,
  AlertOctagon,
  Activity,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'halls'
  | 'groups'
  | 'looms'
  | 'fabrics'
  | 'orders'
  | 'entry'
  | 'stoppages'
  | 'monitoring'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  stoppedLoomsCount?: number;
  delayedOrdersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  stoppedLoomsCount = 0,
  delayedOrdersCount = 0,
}) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'halls' as NavTab, label: 'الصالات', icon: Building2, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'groups' as NavTab, label: 'مجموعات الأنوال', icon: Grid2X2, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'looms' as NavTab, label: 'الأنوال', icon: Cpu, roles: ['manager', 'coordinator', 'hall_manager'], badge: stoppedLoomsCount > 0 ? stoppedLoomsCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'fabrics' as NavTab, label: 'الأصناف', icon: Layers, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'orders' as NavTab, label: 'أوامر الإنتاج', icon: ClipboardList, roles: ['manager', 'coordinator', 'hall_manager'], badge: delayedOrdersCount > 0 ? delayedOrdersCount : undefined, badgeColor: 'bg-rose-500' },
    { id: 'entry' as NavTab, label: 'إدخال الإنتاج', icon: PenTool, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'stoppages' as NavTab, label: 'توقفات الأنوال', icon: AlertOctagon, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'monitoring' as NavTab, label: 'مراقبة الإنتاج', icon: Activity, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'reports' as NavTab, label: 'التقارير', icon: BarChart3, roles: ['manager', 'coordinator', 'hall_manager'] },
    { id: 'users' as NavTab, label: 'المستخدمون', icon: Users, roles: ['manager'] },
    { id: 'audit' as NavTab, label: 'سجل العمليات', icon: ShieldCheck, roles: ['manager', 'coordinator'] },
    { id: 'settings' as NavTab, label: 'الإعدادات', icon: Settings, roles: ['manager'] },
  ];

  const filteredItems = navItems.filter((item) => hasRole(...(item.roles as any)));

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return { label: 'مدير النظام', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' };
      case 'coordinator':
        return { label: 'منسق عام الإنتاج', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
      case 'hall_manager':
        return { label: 'مدير صالة النسيج', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300' };
      default:
        return { label: 'شاغر وظيفي', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : { label: '', color: '' };

  return (
    <aside
      className={`fixed top-0 right-0 z-30 h-screen transition-all duration-300 flex flex-col bg-slate-900 text-slate-100 border-l border-slate-800 shadow-xl ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide leading-tight">نظام ادارة الانتاج</h1>
              <p className="text-xs text-slate-400 font-medium">إدارة ومراقبة الأنوال</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white">
            <Cpu className="w-6 h-6" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={collapsed ? 'توسيع القائمة' : 'طَي القائمة'}
        >
          {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info Bar */}
      {!collapsed && user && (
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-300 border border-slate-600">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md mt-0.5 ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group text-right ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />

              {!collapsed && <span className="text-sm flex-1 truncate">{item.label}</span>}

              {!collapsed && item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${item.badgeColor || 'bg-indigo-500'}`}>
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== undefined && (
                <span className={`absolute top-1 left-2 w-2.5 h-2.5 rounded-full ${item.badgeColor || 'bg-indigo-500'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};
