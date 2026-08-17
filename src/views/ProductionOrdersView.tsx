import React, { useState } from 'react';
import { ClipboardList, Plus, Edit2, Trash2, Cpu, Calendar, AlertCircle, X, CheckCircle2, Clock } from 'lucide-react';
import { ProductionOrder, FabricItem, Hall, Loom } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { OrderCompletionCalculator, ProductionCalculator } from '../businessLogic/calculators';

interface ProductionOrdersViewProps {
  orders?: ProductionOrder[];
  fabrics?: FabricItem[];
  halls?: Hall[];
  looms?: Loom[];
  searchTerm?: string;
  onRefresh: () => void;
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({
  orders = [],
  fabrics = [],
  halls = [],
  looms = [],
  searchTerm = '',
  onRefresh,
}) => {
  const { canEditLoom, canDeleteRecords } = useAuth();
  const safeOrders = orders || [];
  const safeFabrics = fabrics || [];
  const safeHalls = halls || [];
  const safeLooms = looms || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [fabricItemId, setFabricItemId] = useState('');
  const [requiredQuantityMeters, setRequiredQuantityMeters] = useState(50000);
  const [startDate, setStartDate] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [hallId, setHallId] = useState('');
  const [assignedLoomIds, setAssignedLoomIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredOrders = safeOrders.filter((po) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      po.orderNumber.toLowerCase().includes(term) ||
      (po.fabricItemName && po.fabricItemName.toLowerCase().includes(term)) ||
      (po.hallName && po.hallName.toLowerCase().includes(term)) ||
      (po.notes && po.notes.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setOrderNumber(`PO-2026-00${safeOrders.length + 1}`);
    setFabricItemId(safeFabrics.length > 0 ? safeFabrics[0].id : '');
    setRequiredQuantityMeters(50000);
    setStartDate(new Date().toISOString().split('T')[0]);
    const future = new Date();
    future.setDate(future.getDate() + 45);
    setTargetDeliveryDate(future.toISOString().split('T')[0]);
    setHallId(safeHalls.length > 0 ? safeHalls[0].id : '');
    setAssignedLoomIds(safeLooms.slice(0, 3).map((l) => l.id));
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (po: ProductionOrder) => {
    setEditingOrder(po);
    setOrderNumber(po.orderNumber);
    setFabricItemId(po.fabricItemId);
    setRequiredQuantityMeters(po.requiredQuantityMeters);
    setStartDate(po.startDate);
    setTargetDeliveryDate(po.targetDeliveryDate);
    setHallId(po.hallId);
    setAssignedLoomIds(po.assignedLoomIds || []);
    setNotes(po.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, poNum: string) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف أمر الإنتاج ${poNum}؟`)) return;
    try {
      await apiFetch(`/api/production-orders/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف أمر الإنتاج');
    }
  };

  const toggleLoomSelection = (loomId: string) => {
    if (assignedLoomIds.includes(loomId)) {
      setAssignedLoomIds(assignedLoomIds.filter((id) => id !== loomId));
    } else {
      setAssignedLoomIds([...assignedLoomIds, loomId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        orderNumber,
        fabricItemId,
        requiredQuantityMeters: Number(requiredQuantityMeters),
        startDate,
        targetDeliveryDate,
        hallId,
        assignedLoomIds,
        notes,
      };

      if (editingOrder) {
        await apiFetch(`/api/production-orders/${editingOrder.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/production-orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ أمر الإنتاج');
    } finally {
      setLoading(false);
    }
  };

  // Helper calculation for assigned looms daily rate
  const selectedLoomsList = safeLooms.filter((l) => assignedLoomIds.includes(l.id));
  const selectedFabric = safeFabrics.find((f) => f.id === fabricItemId);
  const totalDailyRate = selectedLoomsList.reduce((sum, l) => {
    const picks = selectedFabric ? selectedFabric.weftDensity : l.picksPerCm;
    return sum + ProductionCalculator.expectedDailyMeters(l.rpm, picks, l.dailyOperatingHours, l.defaultEfficiencyPercent);
  }, 0);

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">أوامر الإنتاج وتخصيص الأنوال</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إنشاء متابعة أوامر العمل، تخصيص مجموعات الأنوال وحساب تواريخ التسليم المتوقعة
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أمر إنتاج جديد</span>
          </button>
        )}
      </div>

      {/* Orders Cards List */}
      <div className="space-y-4">
        {filteredOrders.map((po) => {
          const fabric = safeFabrics.find((f) => f.id === po.fabricItemId);
          const assignedLooms = safeLooms.filter((l) => po.assignedLoomIds?.includes(l.id));

          // Calculate daily rate for assigned looms
          const dailyRate = assignedLooms.reduce((sum, l) => {
            const picks = fabric ? fabric.weftDensity : l.picksPerCm;
            return sum + ProductionCalculator.expectedDailyMeters(l.rpm, picks, l.dailyOperatingHours, l.defaultEfficiencyPercent);
          }, 0);

          const calc = OrderCompletionCalculator.calculateOrderStatus(
            po.requiredQuantityMeters,
            po.producedQuantityMeters,
            dailyRate,
            po.targetDeliveryDate
          );

          return (
            <div
              key={po.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">{po.orderNumber}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {po.fabricItemName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      تاريخ البدء: {po.startDate} | موعد التسليم المطلوب: {po.targetDeliveryDate || 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {calc.isDelayed ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                      ⚠️ متأخر عن الخطة
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      ✓ يعمل في الموعد
                    </span>
                  )}

                  {canEditLoom && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(po)}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-xs font-semibold"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {canDeleteRecords && (
                        <button
                          onClick={() => handleDelete(po.id, po.orderNumber)}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-xs font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress & Metrics Bar */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">نسبة الإنجاز الفعلي:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{calc.completionPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${calc.completionPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>تم إنتاج: {po.producedQuantityMeters.toLocaleString()} متر</span>
                    <span>المطلوب: {po.requiredQuantityMeters.toLocaleString()} متر</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px]">الأنوال المخصصة للعمل:</span>
                  <strong className="text-slate-800 dark:text-white font-bold flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    {assignedLooms.length > 0
                      ? assignedLooms.map((l) => `نول ${l.loomNumber}`).join('، ')
                      : 'لم يتم تخصيص أنوال'}
                  </strong>
                  <span className="text-slate-400 block text-[10px] mt-1">الإنتاج اليومي المتوقع:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{dailyRate.toLocaleString()} متر/يوم</strong>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء المتوقع:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold text-sm block">
                    {calc.estimatedCompletionDate}
                  </strong>
                  <span className="text-slate-400 block text-[10px]">الأيام المتبقية:</span>
                  <strong className="text-slate-700 dark:text-slate-300 font-bold">{calc.remainingDays} يوم عمل</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingOrder ? 'تعديل أمر الإنتاج' : 'إنشاء أمر إنتاج جديد'}
              </h3>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم أمر الإنتاج</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الصنف المطلوب</label>
                  <select
                    value={fabricItemId}
                    onChange={(e) => setFabricItemId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الكمية بالمتر</label>
                  <input
                    type="number"
                    value={requiredQuantityMeters}
                    onChange={(e) => setRequiredQuantityMeters(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تاريخ بدء التشغيل</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">موعد التسليم المطلوب</label>
                  <input
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              {/* Loom Assignment Selection Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-white">
                      اختر الأنوال المخصصة لتشغيل هذا الصنف:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      تم اختيار ({assignedLoomIds.length}) من أصل ({looms.length}) نول
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const targetLooms = hallId ? looms.filter((l) => l.hallId === hallId) : looms;
                        setAssignedLoomIds(targetLooms.map((l) => l.id));
                      }}
                      className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      تحديد الكل {hallId ? 'بالصالة' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedLoomIds([])}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                {/* Looms Filter Tabs / Hall Quick Selector */}
                {halls.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">تحديد سريع حسب الصالة:</span>
                    {halls.map((h) => {
                      const hallLooms = looms.filter((l) => l.hallId === h.id);
                      const allHallSelected = hallLooms.length > 0 && hallLooms.every((l) => assignedLoomIds.includes(l.id));
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            const hallLoomIds = hallLooms.map((l) => l.id);
                            if (allHallSelected) {
                              setAssignedLoomIds(assignedLoomIds.filter((id) => !hallLoomIds.includes(id)));
                            } else {
                              const newIds = Array.from(new Set([...assignedLoomIds, ...hallLoomIds]));
                              setAssignedLoomIds(newIds);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                            allHallSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {h.name} ({hallLooms.length} نول)
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Looms Scrollable Selection Grid */}
                <div className="max-h-64 overflow-y-auto pr-1 space-y-3 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70">
                  {halls.map((hall) => {
                    const hallLooms = looms.filter((l) => l.hallId === hall.id);
                    if (hallLooms.length === 0) return null;

                    return (
                      <div key={hall.id} className="space-y-1.5">
                        <div className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center">
                          <span>{hall.name} ({hallLooms.length} نول)</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            المختار: {hallLooms.filter((l) => assignedLoomIds.includes(l.id)).length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 p-1">
                          {hallLooms.map((loom) => {
                            const isSelected = assignedLoomIds.includes(loom.id);
                            return (
                              <button
                                type="button"
                                key={loom.id}
                                onClick={() => toggleLoomSelection(loom.id)}
                                className={`p-2 rounded-xl border text-xs text-right transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                              >
                                <div className="truncate">
                                  <span className="block font-semibold">نول {loom.loomNumber}</span>
                                  <span className="block text-[10px] text-slate-400 font-normal">{loom.code}</span>
                                </div>
                                {isSelected ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mr-1" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 mr-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200 dark:border-slate-700">
                  <span>مجموع الإنتاج اليومي المتوقع للأنوال المختارة:</span>
                  <strong className="text-emerald-600 font-bold">{totalDailyRate.toLocaleString()} متر/يوم</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
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
                  {loading ? 'جاري الحفظ...' : 'حفظ أمر الإنتاج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
