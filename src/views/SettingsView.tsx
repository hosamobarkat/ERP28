import React, { useState } from 'react';
import { Settings, RefreshCw, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const { isManager } = useAuth();
  const [factoryName, setFactoryName] = useState('معمل النسيج الحديث');
  const [shiftsCount, setShiftsCount] = useState(3);
  const [shiftHours, setShiftHours] = useState(8);
  const [targetEfficiency, setTargetEfficiency] = useState(85);

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('تم حفظ إعدادات النظام بنجاح');
      setTimeout(() => setMessage(''), 3000);
    }, 600);
  };

  const handleResetDemoData = async () => {
    if (
      !window.confirm(
        'هل أنت تأكد من إرادة إعادة ضبط قاعدة البيانات إلى البيانات التجريبية الأولية؟ سيتم مسح التغييرات المضافة!'
      )
    )
      return;

    setResetting(true);
    try {
      await apiFetch('/api/settings/reset-demo', { method: 'POST' });
      setMessage('تمت إعادة ضبط البيانات التجريبية بنجاح!');
      onRefresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'فشلت إعادة ضبط البيانات');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات النظام والمصنع</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ضبط معايير التشغيل للورديات، أهداف الكفاءة وإدارة البيانات
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white pb-2 border-b">إعدادات التشغيل الأساسية</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم المصنع / المعمل</label>
            <input
              type="text"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عدد الورديات اليومية</label>
              <input
                type="number"
                value={shiftsCount}
                onChange={(e) => setShiftsCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ساعات الوردية</label>
              <input
                type="number"
                value={shiftHours}
                onChange={(e) => setShiftHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">مستهدف الكفاءة %</label>
              <input
                type="number"
                value={targetEfficiency}
                onChange={(e) => setTargetEfficiency(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>
        </form>

        {/* Reset Demo Data Danger Zone (Managers only) */}
        {isManager && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  إعادة ضبط البيانات التجريبية بالكامل
                </h4>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  استعادة قاعدة البيانات الافتراضية مع الصالات والأنوال وأوامر الإنتاج النموذجية
                </p>
              </div>

              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'جاري إعادة الضبط...' : 'إعادة ضبط البيانات'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
