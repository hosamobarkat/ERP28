import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { FabricItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

interface FabricItemsViewProps {
  fabrics: FabricItem[];
  onRefresh: () => void;
}

export const FabricItemsView: React.FC<FabricItemsViewProps> = ({ fabrics, onRefresh }) => {
  const { canEditLoom, canDeleteRecords } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<FabricItem | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [warpYarnCount, setWarpYarnCount] = useState('Ne 30/2');
  const [weftYarnCount, setWeftYarnCount] = useState('Ne 20/1');
  const [yarnType, setYarnType] = useState('قطن 100%');
  const [weaveStructure, setWeaveStructure] = useState('2/2 Twill');
  const [reedWidth, setReedWidth] = useState(220);
  const [fabricWidth, setFabricWidth] = useState(190);
  const [warpDensity, setWarpDensity] = useState(32);
  const [weftDensity, setWeftDensity] = useState(20);
  const [requiredRpm, setRequiredRpm] = useState(500);
  const [requiredProductionMeters, setRequiredProductionMeters] = useState(50000);
  const [startDate, setStartDate] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingFabric(null);
    setCode(`FAB-0${fabrics.length + 1}`);
    setName(`صنف نسيج جديد ${fabrics.length + 1}`);
    setDescription('');
    setWarpYarnCount('Ne 30/2');
    setWeftYarnCount('Ne 20/1');
    setYarnType('قطن 100%');
    setWeaveStructure('2/2 Twill');
    setReedWidth(220);
    setFabricWidth(190);
    setWarpDensity(32);
    setWeftDensity(20);
    setRequiredRpm(500);
    setRequiredProductionMeters(50000);
    setStartDate(new Date().toISOString().split('T')[0]);
    setTargetDeliveryDate('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FabricItem) => {
    setEditingFabric(f);
    setCode(f.code);
    setName(f.name);
    setDescription(f.description || '');
    setWarpYarnCount(f.warpYarnCount);
    setWeftYarnCount(f.weftYarnCount);
    setYarnType(f.yarnType);
    setWeaveStructure(f.weaveStructure);
    setReedWidth(f.reedWidth);
    setFabricWidth(f.fabricWidth);
    setWarpDensity(f.warpDensity);
    setWeftDensity(f.weftDensity);
    setRequiredRpm(f.requiredRpm);
    setRequiredProductionMeters(f.requiredProductionMeters);
    setStartDate(f.startDate || '');
    setTargetDeliveryDate(f.targetDeliveryDate || '');
    setNotes(f.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, fabricName: string) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف ${fabricName}؟`)) return;
    try {
      await apiFetch(`/api/fabric-items/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصنف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        code,
        name,
        description,
        warpYarnCount,
        weftYarnCount,
        yarnType,
        weaveStructure,
        reedWidth: Number(reedWidth),
        fabricWidth: Number(fabricWidth),
        warpDensity: Number(warpDensity),
        weftDensity: Number(weftDensity),
        requiredRpm: Number(requiredRpm),
        requiredProductionMeters: Number(requiredProductionMeters),
        startDate,
        targetDeliveryDate,
        notes,
      };

      if (editingFabric) {
        await apiFetch(`/api/fabric-items/${editingFabric.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/fabric-items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الصنف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الأصناف النسيجية</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل مواصفات القماش، أنواع خيوط السداء واللحمة والكثافات المطلوب
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف نسيجي جديد</span>
          </button>
        )}
      </div>

      {/* Fabric Items Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fabrics.map((fabric) => (
          <div
            key={fabric.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white">{fabric.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{fabric.code}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {fabric.yarnType}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{fabric.description || 'لا يوجد وصف مخصص'}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">نمرة السداء:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{fabric.warpYarnCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">نمرة اللحمة:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{fabric.weftYarnCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">التركيب النسيجي:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{fabric.weaveStructure}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">عرض المشط/القماش:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{fabric.reedWidth} / {fabric.fabricWidth} سم</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">كثافة اللحمة:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{fabric.weftDensity} Picks/cm</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">سرعة النول:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{fabric.requiredRpm} RPM</strong>
                </div>
              </div>
            </div>

            {canEditLoom && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => handleOpenEdit(fabric)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                {canDeleteRecords && (
                  <button
                    onClick={() => handleDelete(fabric.id, fabric.name)}
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

      {/* Fabric Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingFabric ? 'تعديل بيانات الصنف' : 'إضافة صنف نسيجي جديد'}
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">كود الصنف</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم الصنف</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نمرة خيط السداء</label>
                  <input
                    type="text"
                    value={warpYarnCount}
                    onChange={(e) => setWarpYarnCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نمرة خيط اللحمة</label>
                  <input
                    type="text"
                    value={weftYarnCount}
                    onChange={(e) => setWeftYarnCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نوع الخيط</label>
                  <input
                    type="text"
                    value={yarnType}
                    onChange={(e) => setYarnType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">التركيب النسيجي</label>
                  <input
                    type="text"
                    value={weaveStructure}
                    onChange={(e) => setWeaveStructure(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عرض المشط (سم)</label>
                  <input
                    type="number"
                    value={reedWidth}
                    onChange={(e) => setReedWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عرض القماش (سم)</label>
                  <input
                    type="number"
                    value={fabricWidth}
                    onChange={(e) => setFabricWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">كثافة السداء</label>
                  <input
                    type="number"
                    value={warpDensity}
                    onChange={(e) => setWarpDensity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">كثافة اللحمة Picks/cm</label>
                  <input
                    type="number"
                    value={weftDensity}
                    onChange={(e) => setWeftDensity(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">سرعة النول المطلوب (RPM)</label>
                  <input
                    type="number"
                    value={requiredRpm}
                    onChange={(e) => setRequiredRpm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الكمية المطلوبة (متر)</label>
                  <input
                    type="number"
                    value={requiredProductionMeters}
                    onChange={(e) => setRequiredProductionMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
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
                  {loading ? 'جاري الحفظ...' : 'حفظ بيانات الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
