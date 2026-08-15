import React, { useState } from 'react';
import { Cpu, Plus, Edit2, Trash2, Calculator, AlertCircle, X, CheckCircle2, PauseCircle, Wrench, Slash } from 'lucide-react';
import { Loom, Hall, LoomGroup, LoomStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { ProductionCalculator } from '../businessLogic/calculators';

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

  // Form Fields
  const [loomNumber, setLoomNumber] = useState('');
  const [code, setCode] = useState('');
  const [hallId, setHallId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [rpm, setRpm] = useState(500);
  const [picksPerCm, setPicksPerCm] = useState(20);
  const [reedWidth, setReedWidth] = useState(200);
  const [fabricWidth, setFabricWidth] = useState(180);
  const [dailyOperatingHours, setDailyOperatingHours] = useState(24);
  const [shiftsCount, setShiftsCount] = useState(3);
  const [defaultEfficiencyPercent, setDefaultEfficiencyPercent] = useState(85);
  const [status, setStatus] = useState<LoomStatus>('running');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Theoretical Calculation preview inside Modal
  const theoreticalHourly = ProductionCalculator.hourlyTheoreticalMeters(Number(rpm), Number(picksPerCm));
  const theoreticalDaily = ProductionCalculator.dailyTheoreticalMeters(Number(rpm), Number(picksPerCm), Number(dailyOperatingHours));
  const expectedDaily = ProductionCalculator.expectedDailyMeters(Number(rpm), Number(picksPerCm), Number(dailyOperatingHours), Number(defaultEfficiencyPercent));

  const handleOpenAdd = () => {
    setEditingLoom(null);
    const nextNum = looms.length + 1;
    setLoomNumber(String(nextNum));
    setCode(`NOL-0${nextNum}`);
    setHallId(halls.length > 0 ? halls[0].id : '');
    setGroupId(groups.length > 0 ? groups[0].id : '');
    setManufacturer('Toyota');
    setModel('Airjet 2023');
    setYear('2023');
    setRpm(500);
    setPicksPerCm(20);
    setReedWidth(200);
    setFabricWidth(180);
    setDailyOperatingHours(24);
    setShiftsCount(3);
    setDefaultEfficiencyPercent(85);
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
    setManufacturer(loom.manufacturer || '');
    setModel(loom.model || '');
    setYear(loom.year ? String(loom.year) : '');
    setRpm(loom.rpm);
    setPicksPerCm(loom.picksPerCm);
    setReedWidth(loom.reedWidth);
    setFabricWidth(loom.fabricWidth);
    setDailyOperatingHours(loom.dailyOperatingHours);
    setShiftsCount(loom.shiftsCount);
    setDefaultEfficiencyPercent(loom.defaultEfficiencyPercent);
    setStatus(loom.status);
    setNotes(loom.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, loomNum: string) => {
    if (!window.confirm(`هل أنت تأكد من إرادة حذف نول رقم ${loomNum}؟`)) return;
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
        year: Number(year) || undefined,
        rpm: Number(rpm),
        picksPerCm: Number(picksPerCm),
        reedWidth: Number(reedWidth),
        fabricWidth: Number(fabricWidth),
        dailyOperatingHours: Number(dailyOperatingHours),
        shiftsCount: Number(shiftsCount),
        defaultEfficiencyPercent: Number(defaultEfficiencyPercent),
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
        return { label: 'عمل', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 };
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة وحسابات الأنوال</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدخال مواصفات الأنوال وحساب الإنتاج النظري واليومي المتوقع
          </p>
        </div>
        {canEditLoom && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نول جديد</span>
          </button>
        )}
      </div>

      {/* Looms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {looms.map((loom) => {
          const stInfo = getStatusBadge(loom.status);
          const Icon = stInfo.icon;
          const loomTheoreticalDaily = ProductionCalculator.dailyTheoreticalMeters(loom.rpm, loom.picksPerCm, loom.dailyOperatingHours);
          const loomExpectedDaily = ProductionCalculator.expectedDailyMeters(loom.rpm, loom.picksPerCm, loom.dailyOperatingHours, loom.defaultEfficiencyPercent);

          return (
            <div
              key={loom.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black">
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

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 my-3">
                  <div>
                    <span className="text-slate-400 block">السرعة RPM:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.rpm} دورة/د</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">كثافة اللحمة:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.picksPerCm} حدفة/سم</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">عرض القماش:</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{loom.fabricWidth} سم</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الكفاءة الافتراضية:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{loom.defaultEfficiencyPercent}%</strong>
                  </div>
                </div>

                {/* Theoretical vs Expected Calculation Box */}
                <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">الإنتاج النظري اليومي:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{loomTheoreticalDaily.toLocaleString()} متر/يوم</strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400">الإنتاج اليومي المتوقع:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{loomExpectedDaily.toLocaleString()} متر/يوم</strong>
                  </div>
                </div>
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
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم النول</label>
                  <input
                    type="text"
                    value={loomNumber}
                    onChange={(e) => setLoomNumber(e.target.value)}
                    required
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
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الصالة</label>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">المصنع / الشركة</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الموديل وسنة الصنع</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              {/* Technical Specifications Section */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  المواصفات الفنية للنسيج وحسابات الإنتاج
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      السرعة (RPM)
                    </label>
                    <input
                      type="number"
                      value={rpm}
                      onChange={(e) => setRpm(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      كثافة اللحمة (Picks/cm)
                    </label>
                    <input
                      type="number"
                      value={picksPerCm}
                      onChange={(e) => setPicksPerCm(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      عرض المشط (سم)
                    </label>
                    <input
                      type="number"
                      value={reedWidth}
                      onChange={(e) => setReedWidth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      كفاءة التشغيل %
                    </label>
                    <input
                      type="number"
                      value={defaultEfficiencyPercent}
                      onChange={(e) => setDefaultEfficiencyPercent(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Live Output Calculator Display */}
                <div className="p-3 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">المتر / الساعة:</span>
                    <strong className="text-indigo-700 dark:text-indigo-300 font-bold">{theoreticalHourly} م/ساعة</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">النظري اليومي (24h):</span>
                    <strong className="text-slate-800 dark:text-white font-bold">{theoreticalDaily.toLocaleString()} متر</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">المتوقع الكلي:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{expectedDaily.toLocaleString()} متر</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
