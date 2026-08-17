import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  AlertOctagon, 
  X, 
  CheckCircle2, 
  Building2, 
  UserCheck 
} from 'lucide-react';
import { Withdrawal, WarehouseStockItem, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { exportWithdrawalsToExcel } from '../utils/exportUtils';

interface WithdrawalsViewProps {
  withdrawals: Withdrawal[];
  stock: WarehouseStockItem[];
  userRole: UserRole;
  searchQuery: string;
}

export const WithdrawalsView: React.FC<WithdrawalsViewProps> = ({
  withdrawals,
  stock,
  userRole,
  searchQuery
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // New Withdrawal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [withdrawnKg, setWithdrawnKg] = useState<number>(0);
  const [withdrawnCones, setWithdrawnCones] = useState<number>(0);
  const [department, setDepartment] = useState<string>('قسم التحضير');
  const [productionOrder, setProductionOrder] = useState<string>('');
  const [fabricName, setFabricName] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('أحمد محمود');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const effectiveSearch = localSearch || searchQuery;

  const filteredWithdrawals = withdrawals.filter(item => {
    const matchSearch = 
      item.yarnCount.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      item.department.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      item.withdrawalNumber.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (item.fabricName && item.fabricName.toLowerCase().includes(effectiveSearch.toLowerCase()));

    const matchDept = departmentFilter === 'ALL' || item.department === departmentFilter;

    return matchSearch && matchDept;
  });

  const totalWithdrawnKg = filteredWithdrawals.reduce((s, i) => s + (i.withdrawnKg || 0), 0);
  const totalWithdrawnCones = filteredWithdrawals.reduce((s, i) => s + (i.withdrawnCones || 0), 0);

  const canWithdraw = userRole === 'admin' || userRole === 'warehouse_manager' || userRole === 'production';

  // Selected Stock Item details
  const currentSelectedItem = stock.find(s => s.id === selectedStockId);

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentSelectedItem) {
      setErrorMessage('يرجى اختيار صنف الغزل المراد سحبه.');
      return;
    }

    if (withdrawnKg <= 0) {
      setErrorMessage('يرجى تحديد وزن مسحوب أكبر من صفر.');
      return;
    }

    if (withdrawnKg > currentSelectedItem.netWeightKg) {
      setErrorMessage(`عذراً، الوزن المطلوب (${withdrawnKg} كجم) أكبر من الرصيد المتاح حالياً للمادة (${currentSelectedItem.netWeightKg} كجم).`);
      return;
    }

    try {
      storageService.addWithdrawal({
        withdrawalNumber: `WTH-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        yarnCount: currentSelectedItem.yarnCount,
        origin: currentSelectedItem.origin,
        coneLength: currentSelectedItem.coneLength,
        lotNumber: currentSelectedItem.lotNumber,
        withdrawnKg: withdrawnKg,
        withdrawnCones: withdrawnCones || Math.round(withdrawnKg / (currentSelectedItem.coneLength / 1000) || 0),
        department: department,
        productionOrder: productionOrder || undefined,
        fabricName: fabricName || undefined,
        operatorName: operatorName,
        notes: notes || undefined
      });

      setIsModalOpen(false);
      // reset form
      setSelectedStockId('');
      setWithdrawnKg(0);
      setWithdrawnCones(0);
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تنفيذ عملية السحب.');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">سحوبات الأقسام وصالات التشغيل</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل حركة خروج الغزول إلى صالات النسيج وأقسام التشغيل مع التحقق الفوري من توفر الرصيد وتحديث المخزون.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportWithdrawalsToExcel(filteredWithdrawals)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          {canWithdraw && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل سحب جديد (إذن صرف)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="بحث بنمرة الخيط، إذن السحب، أو القسم..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">جميع الأقسام</option>
            <option value="قسم التحضير">قسم التحضير</option>
            <option value="صالة النسيج A">صالة النسيج A</option>
            <option value="صالة النسيج B">صالة النسيج B</option>
            <option value="قسم التجهيز">قسم التجهيز</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-end text-xs text-slate-500 font-medium">
          عرض {filteredWithdrawals.length} حركة سحب
        </div>
      </div>

      {/* Withdrawals Excel/PDF Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">م</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">رقم الإذن</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">نمرة الخيط</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">المصدر</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">طول الكونة</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-extrabold">
                  إجمالي الوزن KG
                </th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-extrabold">
                  إجمالي الكونات
                </th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">تاريخ التوجيه</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">الاستخدام / القسم</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">أمر الإنتاج والقماش</th>
                <th className="p-3 text-center">المشغل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredWithdrawals.map((item, index) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <td className="p-3 text-center text-slate-400 border-l border-slate-100 dark:border-slate-800">{index + 1}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-800">
                    {item.withdrawalNumber}
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800">
                    {item.yarnCount}
                  </td>
                  <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.origin}
                    </span>
                  </td>
                  <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono">
                    {item.coneLength ? item.coneLength.toLocaleString('ar-EG') : '-'}
                  </td>
                  <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400 border-l border-slate-100 dark:border-slate-800 bg-rose-50/20 dark:bg-rose-950/10">
                    {item.withdrawnKg ? item.withdrawnKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '0'}
                  </td>
                  <td className="p-3 text-center font-bold text-rose-600 dark:text-rose-400 border-l border-slate-100 dark:border-slate-800 bg-rose-50/20 dark:bg-rose-950/10">
                    {item.withdrawnCones ? item.withdrawnCones.toLocaleString('ar-EG') : '0'}
                  </td>
                  <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    {item.date}
                  </td>
                  <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {item.department}
                    </span>
                  </td>
                  <td className="p-3 border-l border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    {item.productionOrder || item.fabricName ? (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.fabricName || '-'}</span>
                        <span className="text-[10px] text-slate-400">{item.productionOrder || ''}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                    {item.operatorName || '-'}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals Summary Footer */}
            <tfoot>
              <tr className="bg-purple-950 text-white font-extrabold text-xs">
                <td colSpan={5} className="p-3 text-left pl-4">إجمالي السحوبات المسجلة</td>
                <td className="p-3 text-center bg-rose-950 text-rose-300 text-sm">
                  {totalWithdrawnKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم
                </td>
                <td className="p-3 text-center bg-rose-950 text-rose-300 text-sm">
                  {totalWithdrawnCones.toLocaleString('ar-EG')}
                </td>
                <td colSpan={4} className="p-3 text-center text-purple-200">
                  تحديث تلقائي للمخزون الفعلي
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: New Withdrawal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">إذن سحب مواد من المستودع</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateWithdrawal} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">اختر صنف الغزل من المخزون *</label>
                <select
                  required
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  <option value="">-- اختر الغزل المتاح --</option>
                  {stock.map(s => (
                    <option key={s.id} value={s.id} disabled={s.netWeightKg <= 0}>
                      {s.yarnCount} ({s.origin}) | طول الكونة: {s.coneLength} | اللوط: {s.lotNumber || 'LOT-MAIN'} | المتاح: {s.netWeightKg} كجم ({s.netCones} كونة)
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedItem && (
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">طول الكونة: <b className="font-mono text-slate-900 dark:text-white">{currentSelectedItem.coneLength}</b></span>
                    <span className="text-slate-600 dark:text-slate-300">اللوط: <b className="font-mono text-amber-700 dark:text-amber-300">{currentSelectedItem.lotNumber || 'LOT-MAIN'}</b></span>
                  </div>
                  <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                    الرصيد المتاح: {currentSelectedItem.netWeightKg} كجم ({currentSelectedItem.netCones} كونة)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">الوزن المسحوب (كجم) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawnKg}
                    onChange={(e) => {
                      const kg = Number(e.target.value);
                      setWithdrawnKg(kg);
                      if (currentSelectedItem && currentSelectedItem.coneLength > 0) {
                        setWithdrawnCones(Math.round(kg / (currentSelectedItem.coneLength / 1000) || 0));
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">عدد الكونات المسحوبة</label>
                  <input
                    type="number"
                    value={withdrawnCones}
                    onChange={(e) => setWithdrawnCones(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">القسم / الجهة *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="قسم التحضير">قسم التحضير</option>
                    <option value="صالة النسيج A">صالة النسيج A</option>
                    <option value="صالة النسيج B">صالة النسيج B</option>
                    <option value="قسم التجهيز">قسم التجهيز</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">اسم المشغل / المستلم</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">أمر الإنتاج (اختياري)</label>
                  <input
                    type="text"
                    value={productionOrder}
                    onChange={(e) => setProductionOrder(e.target.value)}
                    placeholder="مثال: ORD-8803"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">اسم القماش (اختياري)</label>
                  <input
                    type="text"
                    value={fabricName}
                    onChange={(e) => setFabricName(e.target.value)}
                    placeholder="مثال: قماش جينز فاخر"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية على إذن الصرف..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  اعتماد إذن الصرف وتنزيل المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
