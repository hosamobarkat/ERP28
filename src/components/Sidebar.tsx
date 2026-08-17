import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Warehouse, 
  ArrowUpRight, 
  History, 
  Lightbulb, 
  ShieldAlert, 
  Boxes,
  MessageCircle,
  X,
  Database,
  Cpu,
  LogOut
} from 'lucide-react';
import { WarehouseActiveTab } from '../types';

export type ActiveTab = WarehouseActiveTab;

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  pendingPoCount: number;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onSwitchToProduction?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  pendingPoCount,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onSwitchToProduction,
  onLogout,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'purchases' as ActiveTab,
      label: 'جدول المشتريات',
      icon: ShoppingCart,
      badge: pendingPoCount > 0 ? pendingPoCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    },
    {
      id: 'warehouse' as ActiveTab,
      label: 'رصيد المستودع الحقيقي',
      icon: Warehouse,
      badge: lowStockCount > 0 ? `${lowStockCount} منخفض` : null,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
    },
    {
      id: 'withdrawals' as ActiveTab,
      label: 'سحوبات الأقسام',
      icon: ArrowUpRight,
      badge: null
    },
    {
      id: 'movements' as ActiveTab,
      label: 'كشف حركات المخزون',
      icon: History,
      badge: null
    },
    {
      id: 'recommendations' as ActiveTab,
      label: 'توصيات الشراء الذكية',
      icon: Lightbulb,
      badge: 'ذكاء ERP',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
    },
    {
      id: 'audit' as ActiveTab,
      label: 'سجل العمليات والأمان',
      icon: ShieldAlert,
      badge: null
    },
    {
      id: 'backup' as ActiveTab,
      label: 'النسخ الاحتياطي والاستعادة',
      icon: Database,
      badge: 'JSON',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    }
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Factory & Warehouse Context Badge */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 border border-emerald-200/60 dark:border-emerald-800/50">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
            <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>مستودع الغزول الرئيسي</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
            إدارة الواردات والأرصدة وسحوبات الصالات
          </p>
        </div>

        {/* Switch Module Button in Sidebar */}
        {onSwitchToProduction && (
          <button
            onClick={onSwitchToProduction}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer group"
            title="التبديل إلى نظام إنتاج النسيج"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>نظام إنتاج النسيج</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md">
              تبديل
            </span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="px-3 py-3 space-y-1 overflow-y-auto flex-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Developer Credits */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              تم التصميم بواسطة:
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              م. حسام بركات
            </p>
          </div>

          <a
            href="https://wa.me/963930379962"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs group cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white transition-transform group-hover:scale-110" />
            <span dir="ltr" className="font-mono text-xs tracking-wider">+963930379962</span>
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج للبوابة</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer container */}
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800 z-10 transition-transform">
            
            {/* Mobile Drawer Top Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">القائمة الرئيسية</span>
                  <span className="text-[10px] text-slate-500">مستودع الغزول</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};
