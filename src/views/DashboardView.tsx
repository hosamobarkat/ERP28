import React from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  TrendingUp,
  BarChart2,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Loom, ProductionOrder, ProductionEntry, LoomStoppage } from '../types';

interface DashboardViewProps {
  looms: Loom[];
  orders: ProductionOrder[];
  entries: ProductionEntry[];
  stoppages: LoomStoppage[];
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  looms,
  orders,
  entries,
  stoppages,
  onNavigateTab,
}) => {
  // Counters
  const runningCount = looms.filter((l) => l.status === 'running').length;
  const stoppedCount = looms.filter((l) => l.status === 'stopped').length;
  const maintenanceCount = looms.filter((l) => l.status === 'maintenance').length;
  const unavailableCount = looms.filter((l) => l.status === 'unavailable').length;

  // Production Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const todayProduction = todayEntries.reduce((sum, e) => sum + e.actualMeters, 0);

  const totalEntriesMeters = entries.reduce((sum, e) => sum + e.actualMeters, 0);
  const totalTheoreticalMeters = entries.reduce((sum, e) => sum + e.theoreticalMeters, 0);
  const avgEfficiency =
    totalTheoreticalMeters > 0
      ? Math.round((totalEntriesMeters / totalTheoreticalMeters) * 1000) / 10
      : 85;

  const activeOrders = orders.filter((o) => o.status === 'in_progress');
  const delayedOrders = orders.filter((o) => o.status === 'delayed');

  // Loom Performance Ranking (Top 5 & Bottom 5 by Efficiency)
  const loomEffMap = new Map<string, { loom: Loom; actual: number; theoretical: number }>();
  looms.forEach((l) => loomEffMap.set(l.id, { loom: l, actual: 0, theoretical: 0 }));

  entries.forEach((e) => {
    const item = loomEffMap.get(e.loomId);
    if (item) {
      item.actual += e.actualMeters;
      item.theoretical += e.theoreticalMeters;
    }
  });

  const rankedLooms = Array.from(loomEffMap.values())
    .map((item) => {
      const eff =
        item.theoretical > 0
          ? Math.round((item.actual / item.theoretical) * 100)
          : item.loom.defaultEfficiencyPercent;
      return {
        loomNumber: item.loom.loomNumber,
        hallName: item.loom.hallName,
        efficiency: eff,
        totalMeters: item.actual,
        status: item.loom.status,
      };
    })
    .sort((a, b) => b.efficiency - a.efficiency);

  const topLooms = rankedLooms.slice(0, 5);
  const bottomLooms = [...rankedLooms].reverse().slice(0, 5);

  // Chart Data: Status Pie Chart
  const statusPieData = [
    { name: 'يعمل', value: runningCount, color: '#10b981' },
    { name: 'متوقف', value: stoppedCount, color: '#f59e0b' },
    { name: 'صيانة', value: maintenanceCount, color: '#ef4444' },
    { name: 'غير متاح', value: unavailableCount, color: '#64748b' },
  ];

  // Chart Data: Production Comparison (Daily mockup / actual entries)
  const chartData = [
    { name: 'الأحد', actual: 1250, target: 1400 },
    { name: 'الإثنين', actual: 1380, target: 1400 },
    { name: 'الثلاثاء', actual: 1450, target: 1400 },
    { name: 'الأربعاء', actual: 1310, target: 1400 },
    { name: 'الخميس', actual: todayProduction > 0 ? todayProduction : 1290, target: 1400 },
  ];

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Looms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي عدد الأنوال</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{looms.length} نول</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
              🟢 {runningCount} يعمل
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center">
              🟡 {stoppedCount + maintenanceCount} متوقف/صيانة
            </span>
          </div>
        </div>

        {/* Card 2: Today Production */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">إنتاج اليوم الفعلي</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {todayProduction.toLocaleString()} متر
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            مستهدف اليوم: <span className="font-bold text-slate-700 dark:text-slate-300">1,400 متر</span>
          </div>
        </div>

        {/* Card 3: Average Efficiency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">متوسط كفاءة التشغيل</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{avgEfficiency}%</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            الهدف الكلي: <span className="font-bold text-emerald-600">85%+</span>
          </div>
        </div>

        {/* Card 4: Active Production Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-purple-500 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">أوامر الإنتاج النشطة</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{activeOrders.length} أمر</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-xs">
            {delayedOrders.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                ⚠️ {delayedOrders.length} أمر متأخر عن الموعد
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ جميع الأوامر تعمل في الموعد المحدد
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production vs Target Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">الإنتاج اليومي الفعلي مقابل الهدف</h3>
              <p className="text-xs text-slate-400">مقارنة بالأمتار للأيام الماضية</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              عرض التقرير الكامل ←
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="actual" name="الإنتاج الفعلي (متر)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="الهدف النظري (متر)" fill="#0284c7" opacity={0.3} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Looms Status Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">حالة الأنوال الحالية</h3>
            <p className="text-xs text-slate-400 mb-4">توزيع الأنوال في الصالات حسب حالة التشغيل</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {statusPieData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {s.name}: <strong className="text-slate-800 dark:text-white">{s.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top & Bottom Performing Looms Table Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Looms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              أعلى الأنوال إنتاجاً وكفاءة (Top 5)
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              أداء مميز
            </span>
          </div>
          <div className="space-y-2.5">
            {topLooms.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">نول رقم {item.loomNumber}</h4>
                    <p className="text-slate-400 text-[11px]">{item.hallName}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold text-emerald-600 text-sm">{item.efficiency}%</span>
                  <p className="text-[10px] text-slate-400">{item.totalMeters.toLocaleString()} متر</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 5 Looms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-rose-500" />
              أقل الأنوال إنتاجاً (Bottom 5 - يحتاج متابعة)
            </h3>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
              انخفاض الكفاءة
            </span>
          </div>
          <div className="space-y-2.5">
            {bottomLooms.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">نول رقم {item.loomNumber}</h4>
                    <p className="text-slate-400 text-[11px]">{item.hallName}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold text-rose-600 text-sm">{item.efficiency}%</span>
                  <p className="text-[10px] text-slate-400">{item.totalMeters.toLocaleString()} متر</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
