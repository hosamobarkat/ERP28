import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Calendar, Cpu, Layers } from 'lucide-react';
import { ProductionEntry, Hall, Loom, FabricItem, ProductionOrder } from '../types';

interface ReportsViewProps {
  entries: ProductionEntry[];
  halls: Hall[];
  looms: Loom[];
  fabrics: FabricItem[];
  orders: ProductionOrder[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  entries,
  halls,
  looms,
  fabrics,
  orders,
}) => {
  const [selectedHall, setSelectedHall] = useState('all');
  const [selectedLoom, setSelectedLoom] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedFabric, setSelectedFabric] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (selectedHall !== 'all' && e.hallName !== halls.find((h) => h.id === selectedHall)?.name) return false;
    if (selectedLoom !== 'all' && e.loomId !== selectedLoom) return false;
    if (selectedShift !== 'all' && e.shift !== selectedShift) return false;
    if (selectedFabric !== 'all' && e.fabricItemId !== selectedFabric) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  // Report Summary Aggregations
  const totalActualMeters = filteredEntries.reduce((sum, e) => sum + e.actualMeters, 0);
  const totalTheoreticalMeters = filteredEntries.reduce((sum, e) => sum + e.theoreticalMeters, 0);
  const avgEfficiency =
    totalTheoreticalMeters > 0
      ? Math.round((totalActualMeters / totalTheoreticalMeters) * 1000) / 10
      : 85;

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['التاريخ', 'الوردية', 'النول', 'الصالة', 'أمر الإنتاج', 'الصنف', 'الإنتاج الفعلي', 'الإنتاج النظري', 'الكفاءة %'];
    const rows = filteredEntries.map((e) => [
      e.date,
      e.shift,
      e.loomNumber,
      e.hallName,
      e.orderNumber,
      e.fabricItemName,
      e.actualMeters,
      e.theoreticalMeters,
      `${e.efficiencyPercent}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_إنتاج_النسيج_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Handler
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEntries, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `تقرير_إنتاج_النسيج_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">تقارير الإنتاج والكفاءة المتكاملة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            فلترة متقدمة للتقارير حسب الصالة، النول، الوردية والصنف مع إمكانية التصدير والطباعة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV / Excel</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تصدير JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>فلترة معايير التقرير:</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">الصالة</label>
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              <option value="all">الكل</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">النول</label>
            <select
              value={selectedLoom}
              onChange={(e) => setSelectedLoom(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              <option value="all">جميع الأنوال</option>
              {looms.map((l) => (
                <option key={l.id} value={l.id}>
                  نول {l.loomNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">الوردية</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              <option value="all">جميع الورديات</option>
              <option value="shift_1">الوردية 1</option>
              <option value="shift_2">الوردية 2</option>
              <option value="shift_3">الوردية 3</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">الصنف النسيجي</label>
            <select
              value={selectedFabric}
              onChange={(e) => setSelectedFabric(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              <option value="all">جميع الأصناف</option>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Report Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 p-4 rounded-2xl">
          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold block">مجموع الإنتاج الفعلي للتقرير:</span>
          <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mt-1">
            {totalActualMeters.toLocaleString()} متر
          </h3>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">مجموع الإنتاج النظري:</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {totalTheoreticalMeters.toLocaleString()} متر
          </h3>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">متوسط كفاءة التشغيل المفلترة:</span>
          <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{avgEfficiency}%</h3>
        </div>
      </div>

      {/* Printable Report Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b font-semibold">
              <tr>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">الوردية</th>
                <th className="p-3.5">النول</th>
                <th className="p-3.5">الصالة</th>
                <th className="p-3.5">أمر الإنتاج</th>
                <th className="p-3.5">الصنف</th>
                <th className="p-3.5">الإنتاج الفعلي</th>
                <th className="p-3.5">الإنتاج النظري</th>
                <th className="p-3.5">الكفاءة %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map((e) => (
                <tr key={e.id}>
                  <td className="p-3.5 font-bold">{e.date}</td>
                  <td className="p-3.5">{e.shift}</td>
                  <td className="p-3.5 font-bold">نول {e.loomNumber}</td>
                  <td className="p-3.5 text-slate-400">{e.hallName}</td>
                  <td className="p-3.5">{e.orderNumber}</td>
                  <td className="p-3.5">{e.fabricItemName}</td>
                  <td className="p-3.5 font-bold text-indigo-600">{e.actualMeters.toLocaleString()} متر</td>
                  <td className="p-3.5 text-slate-500">{e.theoreticalMeters.toLocaleString()} متر</td>
                  <td className="p-3.5 font-bold text-emerald-600">{e.efficiencyPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
