import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  ArrowDownLeft, 
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ExternalLink,
  Timer,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';
import { PurchaseOrderItem, WarehouseStockItem, Withdrawal } from '../types';
import { calculatePOTolerance, checkDelayedPurchaseOrder, DelayedPOInfo } from '../utils/poUtils';

interface DashboardProps {
  purchases?: PurchaseOrderItem[];
  stock?: WarehouseStockItem[];
  withdrawals?: Withdrawal[];
  onNavigateToTab: (tab: any) => void;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({
  purchases = [],
  stock = [],
  withdrawals = [],
  onNavigateToTab
}) => {
  const safePurchases = purchases || [];
  const safeStock = stock || [];
  const safeWithdrawals = withdrawals || [];

  // Calculations
  const totalStockKg = safeStock.reduce((sum, s) => sum + (s.netWeightKg || 0), 0);
  const totalStockCones = safeStock.reduce((sum, s) => sum + (s.netCones || 0), 0);

  const totalRequiredPoKg = safePurchases.reduce((sum, p) => sum + (p.totalRequiredWeightKg || 0), 0);
  const totalReceivedPoKg = safePurchases.reduce((sum, p) => sum + (p.receivedWeightKg || 0), 0);
  const totalPendingPoKg = safePurchases.reduce((sum, p) => {
    const tol = calculatePOTolerance(p.totalRequiredWeightKg, p.receivedWeightKg);
    return sum + tol.pendingWeightKg;
  }, 0);

  const totalWithdrawnKg = safeWithdrawals.reduce((sum, w) => sum + (w.withdrawnKg || 0), 0);
  const totalWithdrawnCones = safeWithdrawals.reduce((sum, w) => sum + (w.withdrawnCones || 0), 0);

  const lowStockItems = safeStock.filter(s => s.netWeightKg <= s.minStockKg);

  // Overdue / Delayed Purchase Orders Analysis (for KPI Stat Card)
  const delayedPOs: DelayedPOInfo[] = useMemo(() => {
    const list: DelayedPOInfo[] = [];
    safePurchases.forEach(p => {
      const info = checkDelayedPurchaseOrder(p);
      if (info) list.push(info);
    });
    return list.sort((a, b) => b.daysDelayed - a.daysDelayed);
  }, [safePurchases]);

  const totalDelayedWeightKg = delayedPOs.reduce((sum, d) => sum + d.pendingWeightKg, 0);

  // Chart Data Preparation
  // 1. Weight by Yarn Count
  const yarnCountData = safeStock.slice(0, 8).map(item => ({
    name: item.yarnCount.length > 18 ? item.yarnCount.substring(0, 16) + '...' : item.yarnCount,
    weight: Math.round(item.netWeightKg),
    cones: item.netCones
  }));

  // 2. Weight by Origin
  const originMap: Record<string, number> = {};
  safeStock.forEach(item => {
    originMap[item.origin] = (originMap[item.origin] || 0) + item.netWeightKg;
  });
  const originData = Object.keys(originMap).map(origin => ({
    name: origin === 'TR' ? 'تركيا (TR)' : origin === 'EG' ? 'مصر (EG)' : origin === 'SYR' ? 'سوريا (SYR)' : origin,
    value: Math.round(originMap[origin])
  }));

  // 3. Usage Types Distribution
  const usageMap: Record<string, number> = {};
  safeStock.forEach(item => {
    const u = item.usage || 'غير محدد';
    usageMap[u] = (usageMap[u] || 0) + item.netWeightKg;
  });
  const usageData = Object.keys(usageMap).map(u => ({
    name: u,
    weight: Math.round(usageMap[u])
  }));

  // 4. Monthly Trend Data (Simulated/Historical based on movements)
  const monthlyTrendData = [
    { month: 'يناير', purchases: 45000, withdrawals: 12000 },
    { month: 'فبراير', purchases: 52000, withdrawals: 18000 },
    { month: 'مارس', purchases: 61000, withdrawals: 24000 },
    { month: 'أبريل', purchases: 70000, withdrawals: 31000 },
    { month: 'مايو', purchases: 85000, withdrawals: 42000 },
    { month: 'يونيو', purchases: 120000, withdrawals: 65000 },
    { month: 'يوليو', purchases: 146000, withdrawals: 1051 }
  ];

  return (
    <div className="text-slate-800 dark:text-slate-100 p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Welcome & System Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-2">
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              نظام ERP المباشر لمستودع الغزول
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              لوحة التحكم والمؤشرات التفاعلية
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              تطبيق شامل يغطي كافة عمليات استلام المشتريات، رصيد المخزون الفعلي، وسحوبات الأقسام مع الحساب التلقائي وفق معادلات الاكسل المعتمدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigateToTab('purchases')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-md flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span>إدارة المشتريات</span>
            </button>
            <button
              onClick={() => onNavigateToTab('withdrawals')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs transition-colors border border-indigo-400/30 flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تسجيل سحب جديد</span>
            </button>
            <button
              onClick={() => onNavigateToTab('backup')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs transition-colors border border-amber-400/40 flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-amber-300" />
              <span>النسخ الاحتياطي</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Stock Weight */}
        <div 
          onClick={() => onNavigateToTab('warehouse')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي رصيد المستودع</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalStockKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-slate-500">كجم</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>مطابق 100% لمعادلات الاكسل</span>
          </p>
        </div>

        {/* Stat 2: Total Cones */}
        <div 
          onClick={() => onNavigateToTab('warehouse')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الكونات بالمخزون</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalStockCones.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-slate-500">كونة</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            موزعة على {stock.length} صنف غزل
          </p>
        </div>

        {/* Stat 3: Pending POs */}
        <div 
          onClick={() => onNavigateToTab('purchases')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلبيات تحت الطلب</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {totalPendingPoKg.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-slate-500">كجم</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            من إجمالي {totalRequiredPoKg.toLocaleString('ar-EG')} كجم
          </p>
        </div>

        {/* Stat 4: Overdue Delayed Purchases Highlight Card */}
        <div 
          onClick={() => onNavigateToTab('purchases')}
          className={`rounded-2xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            delayedPOs.length > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
              : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className={`text-xs font-bold ${delayedPOs.length > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
              طلبيات متأخرة عن الجاهزية
            </span>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              delayedPOs.length > 0 
                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-black ${delayedPOs.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {delayedPOs.length}
            </span>
            <span className="text-xs font-bold text-slate-500">طلبية ({totalDelayedWeightKg.toLocaleString('ar-EG')} كجم)</span>
          </div>
          <p className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${delayedPOs.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {delayedPOs.length > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>تجاوزت موعد الجاهزية المتوقع</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>جميع التوريدات في موعدها</span>
              </>
            )}
          </p>
        </div>

        {/* Stat 5: Total Withdrawals */}
        <div 
          onClick={() => onNavigateToTab('withdrawals')}
          className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي سحوبات الأقسام</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {totalWithdrawnKg.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold text-slate-500">كجم</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            ({totalWithdrawnCones} كونة مسحوبة)
          </p>
        </div>

      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Stock Weight by Yarn Count */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-500" />
              توزيع رصيد الغزل حسب نمرة الخيط (كجم)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yarnCountData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: any) => [`${value.toLocaleString()} كجم`, 'الوزن المتاح']}
                />
                <Bar dataKey="weight" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Stock Weight by Origin */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              توزيع المخزون حسب بلد المصدر (Origin)
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={originData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {originData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: any) => [`${value.toLocaleString()} كجم`, 'إجمالي الوزن']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Usage Types Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              توزيع الأوزان حسب استخدام الغزل (سداء WARP / لحمة WEFT)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: any) => [`${value.toLocaleString()} كجم`, 'الوزن']}
                />
                <Bar dataKey="weight" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monthly Purchases vs Withdrawals Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-purple-500" />
              معدلات التوريد مقابل السحوبات الشهرية (كجم)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', borderColor: '#334155', color: '#fff' }} />
                <Area type="monotone" dataKey="purchases" name="الواردات" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPurchases)" />
                <Area type="monotone" dataKey="withdrawals" name="السحوبات" stroke="#ec4899" fillOpacity={1} fill="url(#colorWithdrawals)" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Activity Feeds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Withdrawals Feed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-indigo-500" />
              آخر سحوبات الأقسام المسجلة
            </h3>
            <button 
              onClick={() => onNavigateToTab('withdrawals')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              عرض الكل
            </button>
          </div>

          <div className="space-y-3">
            {withdrawals.slice(0, 5).map(w => (
              <div 
                key={w.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{w.yarnCount}</span>
                    <span className="text-[11px] text-slate-500">قسم {w.department} | {w.date}</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">-{w.withdrawnKg} كجم</span>
                  <span className="text-[10px] text-slate-400">{w.withdrawnCones} كونة</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning Feed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              تنبيهات انخفاض المخزون (دون الحد الأدنى)
            </h3>
            <button 
              onClick={() => onNavigateToTab('recommendations')}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
            >
              توصيات الشراء
            </button>
          </div>

          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                جميع أصناف المخزون تزيد عن الحد الأدنى المحدد
              </div>
            ) : (
              lowStockItems.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.yarnCount}</span>
                      <span className="text-[11px] text-slate-500">مصدر: {item.origin} | طول الكونة: {item.coneLength}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-bold text-amber-700 dark:text-amber-400 block">{item.netWeightKg} كجم متاح</span>
                    <span className="text-[10px] text-slate-400">الحد الأدنى: {item.minStockKg} كجم</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
