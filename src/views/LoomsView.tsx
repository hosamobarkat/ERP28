import React, { useState } from 'react';
import { Cpu, Plus, Edit2, Trash2, AlertCircle, X, CheckCircle2, PauseCircle, Wrench, Slash, Layers } from 'lucide-react';
import { Loom, Hall, LoomGroup, LoomStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

interface LoomsViewProps {
  looms: Loom[];
  halls: Hall[];
  groups: LoomGroup[];
  onRefresh: () => void;
}

export const LoomsView: React.FC<LoomsViewProps> = ({ looms, halls, groups, onRefresh }) => {
  const { canEditLoom, canDeleteRecords } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoom, setEditingLoom] = useState<Loom | null>(null);

  // Form Fields (Machine Only)
  const [loomNumber, setLoomNumber] = useState('');
  const [code, setCode] = useState('');
  const [hallId, setHallId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [manufacturer, setManufacturer] = useState('Picanol');
  const [model, setModel] = useState('OptiMax-i-4-R 2017');
  const [year, setYear] = useState('2017');
  const [reedWidth, setReedWidth] = useState(220);
  const [status, setStatus] = useState<LoomStatus>('running');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingLoom(null);
    const nextNum = looms.length + 1;
    setLoomNumber(String(nextNum));
    setCode(`PC-${String(nextNum).padStart(2, '0')}`);
    setHallId(halls.length > 0 ? halls[0].id : '');
    setGroupId(groups.length > 0 ? groups[0].id : '');
    setManufacturer('Picanol');
    setModel('OptiMax-i-4-R 2017');
    setYear('2017');
    setReedWidth(220);
    setStatus('running');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loom: Loom) => {
    setEditingLoom(loom);
    setLoomNumber(loom.loomNumber);
    setCode(loom.code);
    setHallId(loom.hallId);
    setGroupId(loom.groupId);
    setManufacturer(loom.manufacturer || 'Picanol');
    setModel(loom.model || 'OptiMax-i-4-R 2017');
    setYear(loom.year ? String(loom.year) : '2017');
    setReedWidth(loom.reedWidth || 220);
    setStatus(loom.status);
    setNotes(loom.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, loomNum: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف نول رقم ${loomNum}؟`)) return;
    try {
      await apiFetch(`/api/looms/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف النول');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        loomNumber,
        code,
        hallId,
        groupId,
        manufacturer,
        model,
        year: Number(year) || 2017,
        reedWidth: Number(reedWidth) || 220,
        rpm: editingLoom ? editingLoom.rpm : 550,
        picksPerCm: editingLoom ? editingLoom.picksPerCm : 20,
        fabricWidth: editingLoom ? editingLoom.fabricWidth : 190,
        dailyOperatingHours: editingLoom ? editingLoom.dailyOperatingHours : 24,
        shiftsCount: editingLoom ? editingLoom.shiftsCount : 3,
        defaultEfficiencyPercent: editingLoom ? editingLoom.defaultEfficiencyPercent : 88,
        status,
        notes,
      };

      if (editingLoom) {
        await apiFetch(`/api/looms/${editingLoom.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/looms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ النول');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st: LoomStatus) => {
    switch (st) {
      case 'running':
        return { label: 'يعمل', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 };
      case 'stopped':
        return { label: 'متوقف', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: PauseCircle };
      case 'maintenance':
        return { label: 'صيانة', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', icon: Wrench };
      case 'unavailable':
        return { label: 'غير متاح', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: Slash };
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الأنوال النسيجية (96 نول)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل ومواصفات الأنوال الميكانيكية (Picanol OptiMax-i-4-R 2017) موزعة على الصالات والمجموعات
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نول جديد</span>
          </button>
        )}
      </div>

      {/* Looms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {looms.map((loom) => {
          const stInfo = getStatusBadge(loom.status);
          const Icon = stInfo.icon;

          return (
            <div
              key={loom.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {loom.loomNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-white">نول {loom.code}</h3>
                      <p className="text-[11px] text-slate-400">{loom.hallName} - {loom.groupName}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${stInfo.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{stInfo.label}</span>
                  </span>
                </div>

                {/* Machine Specifications Box */}
                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 my-3 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الشركة المصنعة:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.manufacturer || 'Picanol'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الموديل:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.model || 'OptiMax-i-4-R 2017'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">سنة الصنع:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.year || 2017}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">عرض المشط:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{loom.reedWidth || 220} سم</strong>
                  </div>
                </div>

                {/* Currently Assigned Production Order & Fabric (if any) */}
                {loom.currentFabricName ? (
                  <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        <span>الصنف المشغّل حالياً:</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 rounded text-[10px]">
                        {loom.currentOrderNumber || 'طلب نشط'}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate">
                      {loom.currentFabricName}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                    جاهز للربط مع أوامر الإنتاج والأصناف
                  </div>
                )}

                {loom.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1 italic">
                    ملاحظة: {loom.notes}
                  </p>
                )}
              </div>

              {canEditLoom && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleOpenEdit(loom)}
                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  {canDeleteRecords && (
                    <button
                      onClick={() => handleDelete(loom.id, loom.loomNumber)}
                      className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loom Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingLoom ? 'تعديل بيانات النول' : 'إضافة نول جديد'}
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم النول</label>
                  <input
                    type="text"
                    value={loomNumber}
                    onChange={(e) => setLoomNumber(e.target.value)}
                    required
                    placeholder="مثال: 1"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">كود النول</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="مثال: PC-01"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الصالة الإنتاجية</label>
                  <select
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">المجموعة</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الشركة المصنعة</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                    placeholder="Picanol"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الموديل</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    placeholder="OptiMax-i-4-R 2017"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">سنة الصنع</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    placeholder="2017"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عرض المشط (Reed Width)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={reedWidth}
                      onChange={(e) => setReedWidth(Number(e.target.value))}
                      required
                      placeholder="220"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">سم</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">حالة النول</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LoomStatus)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="running">🟢 يعمل</option>
                    <option value="stopped">🟡 متوقف</option>
                    <option value="maintenance">🔴 صيانة</option>
                    <option value="unavailable">⚪ غير متاح</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات تشغيلية</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات اختيارية..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ بيانات النول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

