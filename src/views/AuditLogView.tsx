import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api/client';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/audit-logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">سجل التدقيق والعمليات (Audit Log)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة دقيقة لكل التغييرات والإضافات وحركات المستخدمين
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b">
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">المستخدم</th>
                <th className="p-3.5">نوع العملية</th>
                <th className="p-3.5">القسم / الكيان</th>
                <th className="p-3.5">تفاصيل العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-white">{log.username}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{log.entity}</td>
                  <td className="p-3.5 text-slate-500 max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
