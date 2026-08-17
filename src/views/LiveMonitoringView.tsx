import React, { useState } from 'react';
import { Activity, Cpu, CheckCircle2, PauseCircle, Wrench, Slash, RefreshCw, Zap } from 'lucide-react';
import { Loom, Hall, LoomStatus, ProductionOrder, FabricItem } from '../types';
import { ProductionCalculator } from '../businessLogic/calculators';

interface LiveMonitoringViewProps {
  looms?: Loom[];
  halls?: Hall[];
  orders?: ProductionOrder[];
  fabrics?: FabricItem[];
  onRefresh: () => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  looms = [],
  halls = [],
  orders = [],
  fabrics = [],
  onRefresh,
}) => {
  const safeLooms = looms || [];
  const safeHalls = halls || [];
  const safeOrders = orders || [];
  const safeFabrics = fabrics || [];

  const [selectedHall, setSelectedHall] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLooms = safeLooms.filter((l) => {
    if (selectedHall !== 'all' && l.hallId !== selectedHall) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (st: LoomStatus) => {
    switch (st) {
      case 'running':
        return { label: 'عمل الآن', color: 'bg-emerald-500 text-white animate-pulse', icon: CheckCircle2 };
      case 'stopped':
        return { label: 'متوقف', color: 'bg-amber-500 text-white', icon: PauseCircle };
      case 'maintenance':
        return { label: 'في الصيانة', color: 'bg-rose-500 text-white', icon: Wrench };
      case 'unavailable':
        return { label: 'غير متاح', color: 'bg-slate-500 text-white', icon: Slash };
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">الشاشة اللحظية لمراقبة الأنوال</h2>
            <p className="text-xs text-slate-400">تحديث مباشر لحالة كل نول في صالات المصنع</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="all">جميع الصالات ({safeHalls.length})</option>
            {safeHalls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="all">جميع الحالات</option>
            <option value="running">🟢 تعمل</option>
            <option value="stopped">🟡 متوقفة</option>
            <option value="maintenance">🔴 صيانة</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Monitor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLooms.map((loom) => {
          const stBadge = getStatusBadge(loom.status);
          const Icon = stBadge.icon;

          // Find active order assigned
          const activeOrder = safeOrders.find((o) => o.assignedLoomIds?.includes(loom.id) && o.status === 'in_progress');
          const fabric = safeFabrics.find((f) => f.id === (activeOrder ? activeOrder.fabricItemId : ''));

          const expectedDaily = ProductionCalculator.expectedDailyMeters(
            loom.rpm,
            fabric ? fabric.weftDensity : loom.picksPerCm,
            loom.dailyOperatingHours,
            loom.defaultEfficiencyPercent
          );

          return (
            <div
              key={loom.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm relative transition-all overflow-hidden ${
                loom.status === 'running'
                  ? 'border-emerald-500/40 dark:border-emerald-950'
                  : loom.status === 'stopped'
                  ? 'border-amber-500/40 dark:border-amber-950'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center">
                    {loom.loomNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-white">نول {loom.code}</h3>
                    <span className="text-[10px] text-slate-400 block">{loom.hallName}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 ${stBadge.color}`}>
                  <Icon className="w-3 h-3" />
                  <span>{stBadge.label}</span>
                </span>
              </div>

              {/* Active Order Tag */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-3 text-xs space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">أمر الإنتاج:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {activeOrder ? activeOrder.orderNumber : 'لا يوجد أمر'}
                  </strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">الصنف الشغال:</span>
                  <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                    {fabric ? fabric.name : 'قماش قياسي'}
                  </strong>
                </div>
              </div>

              {/* Live Parameters */}
              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <div>
                  <span className="text-slate-400 block">السرعة RPM:</span>
                  <strong className="text-slate-800 dark:text-white font-bold">{loom.rpm}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">كثافة اللحمة:</span>
                  <strong className="text-slate-800 dark:text-white font-bold">{fabric ? fabric.weftDensity : loom.picksPerCm} حدفة/سم</strong>
                </div>
                <div className="col-span-2 flex justify-between bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold mt-1">
                  <span>الإنتاج اليومي المتوقع:</span>
                  <span>{expectedDaily.toLocaleString()} متر</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
