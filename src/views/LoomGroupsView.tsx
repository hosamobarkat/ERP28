import React, { useState } from 'react';
import { Grid2X2, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { LoomGroup, Hall } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

interface LoomGroupsViewProps {
  groups?: LoomGroup[];
  halls?: Hall[];
  looms?: any[];
  onRefresh: () => void;
}

export const LoomGroupsView: React.FC<LoomGroupsViewProps> = ({ groups = [], halls = [], onRefresh }) => {
  const { canEditLoom, canDeleteRecords } = useAuth();
  const safeGroups = groups || [];
  const safeHalls = halls || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LoomGroup | null>(null);

  const [hallId, setHallId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setHallId(safeHalls.length > 0 ? safeHalls[0].id : '');
    setName(`المجموعة ${String.fromCharCode(65 + safeGroups.length)}`);
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grp: LoomGroup) => {
    setEditingGroup(grp);
    setHallId(grp.hallId);
    setName(grp.name);
    setDescription(grp.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, groupName: string) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف ${groupName}؟`)) return;
    try {
      await apiFetch(`/api/loom-groups/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف المجموعة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingGroup) {
        await apiFetch(`/api/loom-groups/${editingGroup.id}`, {
          method: 'PUT',
          body: JSON.stringify({ hallId, name, description }),
        });
      } else {
        await apiFetch('/api/loom-groups', {
          method: 'POST',
          body: JSON.stringify({ hallId, name, description }),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة مجموعات الأنوال</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تقسيم الأنوال داخل كل صالة حسب النوع والمواصفات
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مجموعة أنوال جديدة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeGroups.map((grp) => (
          <div
            key={grp.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Grid2X2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {grp.hallName || 'صالة مخصصة'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{grp.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{grp.description || 'لا يوجد وصف'}</p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between">
                <span className="text-slate-500">عدد الأنوال بالمجموعة:</span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{grp.loomCount || 0} نول</strong>
              </div>
            </div>

            {canEditLoom && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => handleOpenEdit(grp)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                {canDeleteRecords && (
                  <button
                    onClick={() => handleDelete(grp.id, grp.name)}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-xs font-semibold flex items-center gap-1"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingGroup ? 'تعديل بيانات المجموعة' : 'إضافة مجموعة أنوال جديد'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الصالة التابعة لها
                </label>
                <select
                  value={hallId}
                  onChange={(e) => setHallId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المجموعة
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
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
