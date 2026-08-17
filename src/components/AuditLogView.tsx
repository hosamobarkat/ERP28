import React from 'react';
import { ShieldCheck, UserCheck, Clock, FileText, RotateCcw, MessageCircle } from 'lucide-react';
import { AuditLog } from '../types';
import { storageService } from '../services/storageService';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">سجل الأمان والعمليات (Audit Log)</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل لكافة حركات الإدخال والتحديث واستلام الشحنات وإذونات الصرف والتعرف على اسم المستخدم ورتبته.
          </p>
        </div>

        <button
          onClick={() => {
            const pwd = window.prompt('إجراء حساس: يرجى إدخال كلمة المرور لتأكيد تصفير ومسح كافة بيانات النظام (كلمة المرور: 123789):');
            if (pwd === null) return;
            if (pwd.trim() === '123789') {
              if (window.confirm('تأكيد نهائي: هل أنت متأكد من تصفير ومسح جميع البيانات في النظام بالكامل للبدء من جديد من الصفر؟\n(سيصبح المخزون وطلبات الشراء والمسحوبات 0)')) {
                storageService.wipeAllDataClean();
                window.location.reload();
              }
            } else {
              alert('كلمة المرور غير صحيحة! تم إلغاء عملية تصفير النظام.');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-600/20 shrink-0 self-start sm:self-auto cursor-pointer"
          title="تصفير ومسح جميع البيانات في النظام للبدء من جديد (يتطلب كلمة المرور)"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تصفير النظام (0)</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">التاريخ والوقت</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">المستخدم</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">نوع الحركة</th>
                <th className="p-3">تفاصيل الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="p-3 text-center text-slate-500 font-mono text-[11px] border-l border-slate-100 dark:border-slate-800">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </td>
                  <td className="p-3 font-bold border-l border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                    {log.userName}
                  </td>
                  <td className="p-3 font-bold border-l border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">
                    {log.action}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
