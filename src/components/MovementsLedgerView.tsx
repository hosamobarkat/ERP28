import React, { useState } from 'react';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { InventoryMovement } from '../types';
import { exportMovementsToExcel } from '../utils/exportUtils';

interface MovementsLedgerViewProps {
  movements: InventoryMovement[];
  searchQuery: string;
}

export const MovementsLedgerView: React.FC<MovementsLedgerViewProps> = ({
  movements,
  searchQuery
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const effectiveSearch = localSearch || searchQuery;

  const filteredMovements = movements.filter(item => {
    const matchSearch = 
      item.yarnCount.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      item.referenceNo.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (item.departmentOrSupplier && item.departmentOrSupplier.toLowerCase().includes(effectiveSearch.toLowerCase()));

    const matchType = typeFilter === 'ALL' || item.type === typeFilter;

    return matchSearch && matchType;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 text-xs font-bold">
              كشف حساب المخزون
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">سجل حركات المخزون التفصيلي</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            كشف حركة تدقيق متسلسل زمني يشبه كشف الحساب البنكي، يوضح كل حركة واردة أو منصرفة مع احتساب الرصيد الجاري التراكمي.
          </p>
        </div>

        <button
          onClick={() => exportMovementsToExcel(filteredMovements)}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>تصدير الكشف إلى Excel</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="بحث بنمرة الخيط، رقم المرجع، أو الجهة..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">جميع أنواع الحركات</option>
            <option value="RECEIPT">إستلام مشتريات (وارد)</option>
            <option value="WITHDRAWAL">صرف سحوبات (منصرف)</option>
            <option value="ADJUSTMENT">تسويات جردية</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-end text-xs text-slate-500 font-medium">
          إجمالي الحركات: {filteredMovements.length} حركة
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">التاريخ والوقت</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">نوع الحركة</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">رقم المرجع</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">نمرة الخيط</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">المصدر والطول</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">الكمية المتأثرة (كجم)</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">عدد الكونات</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-extrabold">
                  الرصيد المتبقي (كجم)
                </th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">الجهة / المورد</th>
                <th className="p-3 text-center">المشغل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredMovements.map((item) => {
                const isReceipt = item.weightChangeKg > 0;

                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-3 border-l border-slate-100 dark:border-slate-800 font-bold">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] ${
                        isReceipt 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {isReceipt ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {item.typeAr}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-800">
                      {item.referenceNo}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800">
                      {item.yarnCount}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {item.origin} ({item.coneLength})
                    </td>
                    <td className={`p-3 text-center font-bold border-l border-slate-100 dark:border-slate-800 ${isReceipt ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isReceipt ? `+${item.weightChangeKg.toLocaleString('ar-EG')}` : `${item.weightChangeKg.toLocaleString('ar-EG')}`} كجم
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800">
                      {item.conesChange > 0 ? `+${item.conesChange}` : item.conesChange}
                    </td>
                    <td className="p-3 text-center font-extrabold text-indigo-900 dark:text-indigo-200 border-l border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10">
                      {item.runningBalanceKg.toLocaleString('ar-EG')} كجم
                    </td>
                    <td className="p-3 border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {item.departmentOrSupplier || '-'}
                    </td>
                    <td className="p-3 text-center text-slate-500">
                      {item.operator || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
