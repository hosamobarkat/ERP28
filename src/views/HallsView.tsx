import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Hall } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

interface HallsViewProps {
  halls?: Hall[];
  looms?: any[];
  onRefresh: () => void;
}

export const HallsView: React.FC<HallsViewProps> = ({ halls = [], onRefresh }) => {
  const { canEditLoom, canDeleteRecords } = useAuth();
  const safeHalls = halls || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingHall(null);
    setNumber(String(safeHalls.length + 1));
    setName(`صالة النسيج ${safeHalls.length + 1}`);
    setDescription('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hall: Hall) => {
    setEditingHall(hall);
    setNumber(hall.number);
    setName(hall.name);
    setDescription(hall.description || '');
    setNotes(hall.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, hallName: string) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف ${hallName}؟`)) return;
    try {
      await apiFetch(`/api/halls/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصالة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingHall) {
        await apiFetch(`/api/halls/${editingHall.id}`, {
          method: 'PUT',
          body: JSON.stringify({ number, name, description, notes }),
        });
      } else {
        await apiFetch('/api/halls', {
          method: 'POST',
          body: JSON.stringify({ number, name, description, notes }),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الصالة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة صالات النسيج</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            عرض وتعيين الصالات الإنتاجية وتوزيعها بالمصنع
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صالة نسيج جديدة</span>
          </button>
        )}
      </div>

      {/* Halls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeHalls.map((hall) => (
          <div
            key={hall.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  صالة رقم {hall.number}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{hall.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                {hall.description || 'لا يوجد وصف مخصص لهذه الصالة'}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">إجمالي الأنوال بالصالة:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{hall.totalLoomsCount} نول</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الحالة:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">نشطة ورئيسية</strong>
                </div>
              </div>
            </div>

            {/* Hall Footer Controls */}
            {canEditLoom && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(hall)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                {canDeleteRecords && (
                  <button
                    onClick={() => handleDelete(hall.id, hall.name)}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hall Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingHall ? 'تعديل بيانات الصالة' : 'إضافة صالة نسيج جديدة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الصالة
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الصالة
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف والتفاصيل
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
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
                  {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
