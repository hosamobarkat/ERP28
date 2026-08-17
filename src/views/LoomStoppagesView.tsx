import React, { useState } from 'react';
import { AlertOctagon, Plus, Clock, AlertCircle, X, Trash2 } from 'lucide-react';
import { LoomStoppage, Loom, DowntimeReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { DowntimeCalculator } from '../businessLogic/calculators';

interface LoomStoppagesViewProps {
  stoppages?: LoomStoppage[];
  looms?: Loom[];
  onRefresh: () => void;
}

export const LoomStoppagesView: React.FC<LoomStoppagesViewProps> = ({
  stoppages = [],
  looms = [],
  onRefresh,
}) => {
  const { canDeleteRecords } = useAuth();
  const safeStoppages = stoppages || [];
  const safeLooms = looms || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [loomId, setLoomId] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [reason, setReason] = useState<DowntimeReason>('mechanical');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const durationMinutes = DowntimeCalculator.calculateDurationMinutes(startTime, endTime);

  const handleOpenAdd = () => {
    setDate(todayStr);
    setLoomId(safeLooms.length > 0 ? safeLooms[0].id : '');
    setStartTime('08:00');
    setEndTime('09:30');
    setReason('mechanical');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من إرادة حذف سجل التوقف هذا؟')) return;
    try {
      await apiFetch(`/api/stoppages/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل الحذف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/api/stoppages', {
        method: 'POST',
        body: JSON.stringify({
          loomId,
          date,
          startTime,
          endTime,
          reason,
          notes,
        }),
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل التوقف');
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (r: DowntimeReason) => {
    switch (r) {
      case 'mechanical':
        return 'عطل ميكانيكي';
      case 'electrical':
        return 'عطل كهربائي';
      case 'warp_break':
        return 'قطع سداء (Warp Break)';
      case 'weft_break':
        return 'قطع لحمة (Weft Break)';
      case 'style_change':
        return 'تغيير صنف / طيّة';
      case 'yarn_shortage':
        return 'عدم توفر خيط';
      case 'maintenance':
        return 'صيانة دورية';
      case 'operator_absent':
        return 'غياب عامل';
      case 'planned_stop':
        return 'توقف مخطط له';
      case 'other':
        return 'أسباب أخرى';
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">توقفات الأنوال والأعطال</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل وتوثيق أسباب ومدد توقفات الأنوال لحساب الهدر وتفادي الأعطال
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل توقف جديد</span>
        </button>
      </div>

      {/* Stoppages Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">النول والصالة</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">مدة التوقف</th>
                <th className="p-3.5">سبب التوقف</th>
                <th className="p-3.5">ملاحظات والتفاصيل</th>
                <th className="p-3.5">سجل بواسطة</th>
                {canDeleteRecords && <th className="p-3.5">حذف</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {safeStoppages.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <strong className="text-slate-800 dark:text-white font-bold block">نول {s.loomNumber}</strong>
                    <span className="text-[11px] text-slate-400">{s.hallName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 dark:text-white block">{s.date}</span>
                    <span className="text-[11px] text-slate-500">
                      من {s.startTime} إلى {s.endTime}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                      {s.durationMinutes} دقيقة
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">{getReasonLabel(s.reason)}</td>
                  <td className="p-3.5 text-slate-500 max-w-xs truncate">{s.notes || '-'}</td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{s.createdBy}</td>
                  {canDeleteRecords && (
                    <td className="p-3.5">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stoppage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">تسجيل توقف نول</h3>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اختر النول</label>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">وقت البداية</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">وقت النهاية</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              {/* Duration Auto Calc Display */}
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-medium">مدة التوقف المحسوبة تلقائياً:</span>
                <strong className="text-rose-600 dark:text-rose-400 font-bold text-sm">{durationMinutes} دقيقة</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">سبب التوقف الرئيسي</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as DowntimeReason)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="mechanical">عطل ميكانيكي</option>
                  <option value="electrical">عطل كهربائي</option>
                  <option value="warp_break">قطع سداء (Warp Break)</option>
                  <option value="weft_break">قطع لحمة (Weft Break)</option>
                  <option value="style_change">تغيير صنف / طيّة</option>
                  <option value="yarn_shortage">عدم توفر خيط</option>
                  <option value="maintenance">صيانة دورية</option>
                  <option value="operator_absent">غياب عامل</option>
                  <option value="planned_stop">توقف مخطط له</option>
                  <option value="other">أسباب أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات وتفاصيل التوقف</label>
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                >
                  {loading ? 'جاري الحفظ...' : 'تسجيل التوقف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
