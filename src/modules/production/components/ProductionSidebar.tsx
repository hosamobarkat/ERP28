import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Cpu,
  Scissors,
  ClipboardList,
  FileSpreadsheet,
  AlertOctagon,
  Activity,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
  Lock
} from 'lucide-react';
import { ProductionNavTab } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface ProductionSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  activeTab: ProductionNavTab;
  setActiveTab: (tab: ProductionNavTab) => void;
  onOpenChangePassword: () => void;
  onSwitchToWarehouse: () => void;
}

export const ProductionSidebar: React.FC<ProductionSidebarProps> = ({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab,
  onOpenChangePassword,
  onSwitchToWarehouse,
}) => {
  const { user, logout, isManager, isCoordinator } = useAuth();

  const menuItems = [
    { id: 'dashboard' as ProductionNavTab, label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'halls' as ProductionNavTab, label: 'صالات النسيج', icon: Building2 },
    { id: 'groups' as ProductionNavTab, label: 'مجموعات الأنوال', icon: Layers },
    { id: 'looms' as ProductionNavTab, label: 'سجل الأنوال (96 نول)', icon: Cpu },
    { id: 'fabrics' as ProductionNavTab, label: 'دليل الأصناف النسيجية', icon: Scissors },
    { id: 'orders' as ProductionNavTab, label: 'أوامر الإنتاج والتسليم', icon: ClipboardList },
    { id: 'entry' as ProductionNavTab, label: 'تسجيل الإنتاج والورديات', icon: FileSpreadsheet },
    { id: 'stoppages' as ProductionNavTab, label: 'سجل التوقفات والأعطال', icon: AlertOctagon },
    { id: 'monitoring' as ProductionNavTab, label: 'المراقبة الفورية للأنوال', icon: Activity },
    { id: 'reports' as ProductionNavTab, label: 'التقارير والإحصائيات', icon: BarChart3 },
    ...(isManager ? [{ id: 'users' as ProductionNavTab, label: 'إدارة المستخدمين', icon: Users }] : []),
    ...((isManager || isCoordinator) ? [{ id: 'audit' as ProductionNavTab, label: 'سجل العمليات', icon: ShieldAlert }] : []),
    ...(isManager ? [{ id: 'settings' as ProductionNavTab, label: 'إعدادات المصنع', icon: Settings }] : []),
  ];

  return (
    <aside
      className={`fixed top-0 right-0 z-30 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col border-l border-slate-800 shadow-2xl ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-sm text-white tracking-wide truncate">نظام إنتاج النسيج</h1>
              <p className="text-[11px] text-indigo-400 font-medium truncate">إدارة 96 نول إلكتروني</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
            <Cpu className="w-6 h-6" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Switch Module Banner */}
      <div className="p-3 border-b border-slate-800/60 bg-indigo-950/30">
        <button
          onClick={onSwitchToWarehouse}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-700/50 text-indigo-200 text-xs font-semibold transition-all group cursor-pointer"
          title="الانتقال إلى نظام مستودع الغزول"
        >
          <div className="flex items-center gap-2.5">
            <Boxes className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
            {!collapsed && <span>مستودع الغزول</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono">
              تبديل
            </span>
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 space-y-2">
        {!collapsed && user && (
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user.fullName || user.username}</p>
              <p className="text-[10px] text-slate-400">
                {user.role === 'manager' && 'مدير النظام'}
                {user.role === 'coordinator' && 'منسق عام الإنتاج'}
                {user.role === 'hall_manager' && 'مدير صالة النسيج'}
                {user.role === 'operator' && 'مشغل نول'}
              </p>
            </div>
            <button
              onClick={onOpenChangePassword}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="تغيير كلمة المرور"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};
