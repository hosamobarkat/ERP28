import React, { useState } from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Printer, 
  ShieldCheck, 
  Boxes,
  AlertTriangle,
  Lock,
  Menu,
  X,
  Cpu,
  LogOut
} from 'lucide-react';
import { WarehouseUserRole, SystemNotification, USER_ACCOUNTS } from '../types';
import { storageService } from '../services/storageService';

interface HeaderProps {
  currentRole: WarehouseUserRole;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: SystemNotification[];
  onOpenSearchModal: () => void;
  onOpenAuthModal: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onSwitchToProduction?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  notifications,
  onOpenSearchModal,
  onOpenAuthModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onSwitchToProduction,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

  const currentAccount = USER_ACCOUNTS[currentRole] || USER_ACCOUNTS.admin;

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Mobile Menu Toggle & Logo / Brand Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="القائمة الجانبية"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  مستودع الغزول
                </span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                  نظام إدارة مستودع الغزول
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate">
                مشتريات • رصيد حقيقي • سحوبات • كشف حركات • توصيات ذكية
              </p>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onOpenSearchModal}
                placeholder="بحث شامل بنمرة الخيط، المصدر، المورد، أو القسم..."
                className="w-full pr-10 pl-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all duration-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            
            {/* Quick Switch to Production Module */}
            {onSwitchToProduction && (
              <button
                onClick={onSwitchToProduction}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="الانتقال إلى نظام إنتاج النسيج"
              >
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span>إنتاج النسيج</span>
              </button>
            )}

            {/* Quick Search Button on Mobile */}
            <button
              onClick={onOpenSearchModal}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="بحث شامل"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="طباعة الصفحة الحالية"
            >
              <Printer className="w-5 h-5" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                title="التنبيهات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 left-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50 text-right">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-white">التنبيهات الإدارية</span>
                    <button 
                      onClick={() => storageService.clearNotifications()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      مسح الكل
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">لا توجد تنبيهات حالية</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => storageService.markNotificationAsRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!n.read && !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {n.type === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                            {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                            <span className="font-bold text-slate-900 dark:text-slate-100">{n.title}</span>
                            <span className="text-[10px] text-slate-400 mr-auto">{n.date}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Switcher Badge */}
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer ${currentAccount.badgeColor}`}
              title="انقر لتغيير الحساب أو إدخال كلمة السر"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{currentAccount.title}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500 mr-0.5 shrink-0 hidden sm:inline" />
            </button>

            {/* Gateway / Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="تسجيل الخروج إلى البوابة الرئيسية"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
