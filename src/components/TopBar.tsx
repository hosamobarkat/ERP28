import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Key, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Sidebar';

interface TopBarProps {
  collapsed: boolean;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notificationsCount: number;
  onToggleNotifications: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  collapsed,
  activeTab,
  setActiveTab,
  onSearch,
  searchTerm,
  isDarkMode,
  toggleDarkMode,
  notificationsCount,
  onToggleNotifications,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'لوحة التحكم الرئيسية والتحليلات';
      case 'halls':
        return 'إدارة صالات النسيج بالمصنع';
      case 'groups':
        return 'إدارة مجموعات الأنوال';
      case 'looms':
        return 'سجل وبيانات الأنوال الإلكترونية';
      case 'fabrics':
        return 'دليل الأصناف والتراكيب النسيجية';
      case 'orders':
        return 'أوامر الإنتاج وتتبع المواعيد';
      case 'entry':
        return 'تسجيل الإنتاج اليومي والورديات';
      case 'stoppages':
        return 'سجل توقفات الأنوال والأعطال';
      case 'monitoring':
        return 'شاشة المراقبة الفورية للأنوال';
      case 'reports':
        return 'التقارير الشاملة والإحصائيات';
      case 'users':
        return 'إدارة المستخدمين والصلاحيات';
      case 'audit':
        return 'سجل حركات النظام والعمليات';
      case 'settings':
        return 'إعدادات النظام العامة';
      default:
        return 'نظام إدارة إنتاج قسم النسيج';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 z-20 h-20 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between ${
        collapsed ? 'right-20' : 'right-72'
      }`}
    >
      {/* Title & Live Time */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white leading-snug">
            {getTabTitle(activeTab)}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Center Global Search */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="بحث سريع برقم النول، كود الصنف، أو رقم الأمر..."
            className="w-full pl-4 pr-10 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Quick Action Icons & Profile */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={isDarkMode ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>

        {/* Notifications Drawer Toggle */}
        <button
          onClick={onToggleNotifications}
          className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="التنبيهات الإدارية"
        >
          <Bell className="w-5 h-5" />
          {notificationsCount > 0 && (
            <span className="absolute top-1.5 left-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {notificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
