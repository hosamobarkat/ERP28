import React, { useState } from 'react';
import { PenTool, Plus, CheckCircle2, AlertCircle, X, Calculator, Clock } from 'lucide-react';
import { Loom, ProductionOrder, FabricItem, ProductionEntry, ShiftType } from '../types';
import { apiFetch } from '../api/client';
import { ProductionCalculator, EfficiencyCalculator } from '../businessLogic/calculators';

interface ProductionEntryViewProps {
  entries?: ProductionEntry[];
  looms?: Loom[];
  orders?: ProductionOrder[];
  fabrics?: FabricItem[];
  onRefresh: () => void;
}

export const ProductionEntryView: React.FC<ProductionEntryViewProps> = ({
  entries = [],
  looms = [],
  orders = [],
  fabrics = [],
  onRefresh,
}) => {
  const safeEntries = entries || [];
  const safeLooms = looms || [];
  const safeOrders = orders || [];
  const safeFabrics = fabrics || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [loomId, setLoomId] = useState('');
  const [productionOrderId, setProductionOrderId] = useState('');
  const [shift, setShift] = useState<ShiftType>('shift_1');
  const [operatingHours, setOperatingHours] = useState(8);
  const [downtimeHours, setDowntimeHours] = useState(0);
  const [actualMeters, setActualMeters] = useState(90);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedLoom = safeLooms.find((l) => l.id === loomId);
  const selectedOrder = safeOrders.find((o) => o.id === productionOrderId);
  const selectedFabric = safeFabrics.find((f) => f.id === (selectedOrder ? selectedOrder.fabricItemId : ''));

  // Live Auto Calculations
  const rpm = selectedLoom ? selectedLoom.rpm : 500;
  const picksPerCm = selectedFabric ? selectedFabric.weftDensity : (selectedLoom ? selectedLoom.picksPerCm : 20);
  const theoreticalMeters = ProductionCalculator.shiftTheoreticalMeters(rpm, picksPerCm, Number(operatingHours));
  const efficiencyPercent = EfficiencyCalculator.calculateEfficiencyPercent(Number(actualMeters), theoreticalMeters);

  const handleOpenAdd = () => {
    setDate(todayStr);
    const firstLoom = safeLooms.length > 0 ? safeLooms[0].id : '';
    setLoomId(firstLoom);
    const firstOrder = safeOrders.length > 0 ? safeOrders[0].id : '';
    setProductionOrderId(firstOrder);
    setShift('shift_1');
    setOperatingHours(8);
    setDowntimeHours(0);
    setActualMeters(90);
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/api/production-entries', {
        method: 'POST',
        body: JSON.stringify({
          date,
          loomId,
          fabricItemId: selectedFabric ? selectedFabric.id : '',
          productionOrderId,
          shift,
          operatingHours: Number(operatingHours),
          downtimeHours: Number(downtimeHours),
          actualMeters: Number(actualMeters),
          notes,
        }),
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الإنتاج');
    } finally {
      setLoading(false);
    }
  };

  const getShiftLabel = (s: ShiftType) => {
    switch (s) {
      case 'shift_1':
        return 'الوردية الأولى (الصباحية)';
      case 'shift_2':
        return 'الوردية الثانية (المسائية)';
      case 'shift_3':
        return 'الوردية الثالثة (الليلية)';
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدخال وتسجيل الإنتاج اليومي والورديات</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل إنتاج الأمتار بكل وردية لكل نول مع حساب الكفاءة تلقائياً ومنع التكرار
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل إنتاج جديد</span>
        </button>
      </div>

      {/* Production Entries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">التاريخ والوردية</th>
                <th className="p-3.5">النول والصالة</th>
                <th className="p-3.5">أمر الإنتاج والتاريخ</th>
                <th className="p-3.5">ساعات التشغيل</th>
                <th className="p-3.5">الإنتاج الفعلي (متر)</th>
                <th className="p-3.5">الإنتاج النظري</th>
                <th className="p-3.5">الكفاءة %</th>
                <th className="p-3.5">المسجِّل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {safeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 dark:text-white block">{entry.date}</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      {getShiftLabel(entry.shift)}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <strong className="text-slate-800 dark:text-white font-bold block">نول {entry.loomNumber}</strong>
                    <span className="text-[11px] text-slate-400">{entry.hallName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 dark:text-white block">{entry.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">{entry.fabricItemName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{entry.operatingHours} ساعة</span>
                    {entry.downtimeHours > 0 && (
                      <span className="text-rose-500 text-[10px] block">توقف: {entry.downtimeHours}س</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {entry.actualMeters.toLocaleString()} متر
                    </strong>
                  </td>
                  <td className="p-3.5 text-slate-500 font-semibold">{entry.theoreticalMeters.toLocaleString()} متر</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        entry.efficiencyPercent >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : entry.efficiencyPercent >= 70
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {entry.efficiencyPercent}%
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">{entry.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">تسجيل قراءة إنتاج يومية جديدة</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الوردية</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftType)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="shift_1">الوردية الأولى (الصباحية)</option>
                    <option value="shift_2">الوردية الثانية (المسائية)</option>
                    <option value="shift_3">الوردية الثالثة (الليلية)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">النول</label>
                  <select
                    value={loomId}
                    onChange={(e) => setLoomId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {looms.map((l) => (
                      <option key={l.id} value={l.id}>
                        نول {l.loomNumber} ({l.code}) - {l.hallName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">أمر الإنتاج</label>
                  <select
                    value={productionOrderId}
                    onChange={(e) => setProductionOrderId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} ({o.fabricItemName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ساعات العمل</label>
                  <input
                    type="number"
                    step="0.5"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ساعات التوقف</label>
                  <input
                    type="number"
                    step="0.5"
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الإنتاج الفعلي (متر)</label>
                  <input
                    type="number"
                    value={actualMeters}
                    onChange={(e) => setActualMeters(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-indigo-600"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">الإنتاج النظري المحسوب:</span>
                  <strong className="text-slate-800 dark:text-white font-bold">{theoreticalMeters} متر</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">كفاءة الوردية المحسوبة:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{efficiencyPercent}%</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                >
                  {loading ? 'جاري الحفظ...' : 'تسجيل القراءة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
