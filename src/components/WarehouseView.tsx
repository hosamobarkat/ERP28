import React, { useState } from 'react';
import { 
  Warehouse, 
  Search, 
  FileSpreadsheet, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2,
  RefreshCw,
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload
} from 'lucide-react';
import { WarehouseStockItem, UserRole, OriginCode, USER_ACCOUNTS } from '../types';
import { exportWarehouseToExcel } from '../utils/exportUtils';
import { storageService } from '../services/storageService';
import { ExcelImportModal } from './ExcelImportModal';

interface WarehouseViewProps {
  stock: WarehouseStockItem[];
  userRole: UserRole;
  searchQuery: string;
  onNavigateToTab: (tab: any) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  stock,
  userRole,
  searchQuery,
  onNavigateToTab
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [usageFilter, setUsageFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');

  // Modal State for Add / Edit Stock Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseStockItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    yarnCount: '',
    origin: 'TR' as OriginCode,
    coneLength: 44000,
    lotNumber: '',
    totalReceivedKg: 1000,
    totalReceivedCones: 300,
    usage: 'WEFT DEN',
    minStockKg: 2000,
    maxStockKg: 20000,
    notes: ''
  });

  const effectiveSearch = localSearch || searchQuery;
  const canEdit = userRole === 'admin' || userRole === 'warehouse_manager';
  const currentUser = USER_ACCOUNTS[userRole]?.name || 'مدير النظام';

  const filteredStock = stock.filter(item => {
    const matchSearch = 
      item.yarnCount.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      item.origin.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (item.lotNumber && item.lotNumber.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
      (item.usage && item.usage.toLowerCase().includes(effectiveSearch.toLowerCase()));

    const matchUsage = usageFilter === 'ALL' || item.usage === usageFilter;
    const matchOrigin = originFilter === 'ALL' || item.origin === originFilter;

    return matchSearch && matchUsage && matchOrigin;
  });

  // Totals
  const totalReceivedKg = filteredStock.reduce((s, i) => s + (i.totalReceivedKg || 0), 0);
  const totalReceivedCones = filteredStock.reduce((s, i) => s + (i.totalReceivedCones || 0), 0);
  const totalWithdrawnKg = filteredStock.reduce((s, i) => s + (i.totalWithdrawnKg || 0), 0);
  const totalWithdrawnCones = filteredStock.reduce((s, i) => s + (i.totalWithdrawnCones || 0), 0);
  const totalNetKg = filteredStock.reduce((s, i) => s + (i.netWeightKg || 0), 0);
  const totalNetCones = filteredStock.reduce((s, i) => s + (i.netCones || 0), 0);

  const handleRecalculate = () => {
    storageService.recalculateInventoryIntegrity();
    window.location.reload();
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      yarnCount: '',
      origin: 'TR',
      coneLength: 44000,
      lotNumber: `LOT-${Math.floor(7000 + Math.random() * 900)}`,
      totalReceivedKg: 1000,
      totalReceivedCones: 300,
      usage: 'WEFT DEN',
      minStockKg: 2000,
      maxStockKg: 20000,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: WarehouseStockItem) => {
    setEditingItem(item);
    setFormData({
      yarnCount: item.yarnCount,
      origin: item.origin,
      coneLength: item.coneLength,
      lotNumber: item.lotNumber || `LOT-${Math.floor(7000 + Math.random() * 900)}`,
      totalReceivedKg: item.totalReceivedKg,
      totalReceivedCones: item.totalReceivedCones,
      usage: item.usage,
      minStockKg: item.minStockKg,
      maxStockKg: item.maxStockKg || 20000,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yarnCount.trim()) {
      alert('يرجى كتابة نمرة الخيط');
      return;
    }

    if (editingItem) {
      storageService.updateWarehouseStockItem({
        ...editingItem,
        ...formData
      }, currentUser, userRole);
    } else {
      storageService.addWarehouseStockItem({
        ...formData,
        warehouseName: 'مستودع الغزول الرئيسي'
      }, currentUser, userRole);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (item: WarehouseStockItem) => {
    if (window.confirm(`هل أنت تأكد من إزالة الصنف "${item.yarnCount}" (اللوط: ${item.lotNumber || '-'}) من المستودع؟`)) {
      storageService.deleteWarehouseStockItem(item.id, currentUser, userRole);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">جدول رصيد المستودع الحقيقي</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            المعادلة الصارمة: الرصيد الصافي = (إجمالي المستلم) ناقص (إجمالي المسحوب). يتم تسجيل كافّة تعديلات وأفعال مدير النظام في سجل العمليات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد للمستودع</span>
            </button>
          )}

          <button
            onClick={handleRecalculate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            title="إعادة احتساب المطابقة مع سجلات السحوبات والاستلام"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            <span>تحديث الرصيد التلقائي</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            title="استيراد وتحديث جرد المستودع من ملف إكسل"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد من Excel</span>
          </button>

          <button
            onClick={() => exportWarehouseToExcel(filteredStock)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel</span>
          </button>
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
            placeholder="بحث بنمرة الخيط، رقم اللوط، المصدر..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">جميع الاستخدامات (دنيم / غبردين)</option>
            <option value="WARP DEN">WARP DEN (سداء دنيم)</option>
            <option value="WEFT DEN">WEFT DEN (لحمة دنيم)</option>
            <option value="WEFT GR">WEFT GR (لحمة غبردين)</option>
            <option value="WARP GR +DEN">WARP GR +DEN (سداء غبردين + دنيم)</option>
            <option value="WARP GR">WARP GR (سداء غبردين)</option>
          </select>
        </div>

        <div>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">جميع المصادر</option>
            <option value="TR">تركيا (TR)</option>
            <option value="EG">مصر (EG)</option>
            <option value="SYR">سوريا (SYR)</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
          عرض {filteredStock.length} صنف غزل
        </div>
      </div>

      {/* Warehouse Excel/PDF Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold whitespace-nowrap">
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800">م</th>
                <th className="py-2.5 px-2 border-l border-slate-200/60 dark:border-slate-800">نمرة الخيط</th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800">المصدر</th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800">طول الكونة</th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">اللوط</th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800 bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-extrabold">
                  الرصيد (KG)
                </th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800 bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-extrabold">
                  عدد الكونات
                </th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800">الملاحظات</th>
                <th className="py-2.5 px-2 text-center border-l border-slate-200/60 dark:border-slate-800">الاستخدام</th>
                {canEdit && (
                  <th className="py-2.5 px-2 text-center">الإجراءات</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredStock.map((item, index) => {
                const isLow = item.netWeightKg <= item.minStockKg;

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="py-2 px-1.5 text-center text-slate-400 border-l border-slate-100 dark:border-slate-800 whitespace-nowrap">{index + 1}</td>
                    <td className="py-2 px-2 font-bold text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {item.yarnCount}
                    </td>
                    <td className="py-2 px-1.5 text-center border-l border-slate-100 dark:border-slate-800 font-semibold whitespace-nowrap">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.origin}
                      </span>
                    </td>
                    <td className="py-2 px-1.5 text-center border-l border-slate-100 dark:border-slate-800 font-mono whitespace-nowrap">
                      {item.coneLength ? item.coneLength.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="py-2 px-1.5 text-center border-l border-slate-100 dark:border-slate-800 font-mono font-bold whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800/60 text-[11px] font-bold whitespace-nowrap">
                        {item.lotNumber || '-'}
                      </span>
                    </td>
                    <td className={`py-2 px-2 text-center font-extrabold border-l border-slate-100 dark:border-slate-800 whitespace-nowrap ${isLow ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'}`}>
                      {item.netWeightKg ? item.netWeightKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '0'}
                    </td>
                    <td className={`py-2 px-2 text-center font-extrabold border-l border-slate-100 dark:border-slate-800 whitespace-nowrap ${isLow ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'}`}>
                      {item.netCones ? item.netCones.toLocaleString('ar-EG') : '0'}
                    </td>
                    <td className="py-2 px-2 text-center border-l border-slate-100 dark:border-slate-800 text-slate-500 text-[11px] whitespace-normal">
                      {item.notes || '-'}
                    </td>
                    <td className="py-2 px-1.5 text-center font-bold border-l border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[11px] font-bold whitespace-nowrap" title={item.usage.includes('DEN') ? 'DEN = أصناف الدنيم' : item.usage.includes('GR') ? 'GR = أصناف الغبردين' : ''}>
                        {item.usage}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-2 px-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="تعديل بيانات الصنف واللوط"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Summary Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td colSpan={5} className="p-3 text-left pl-4">المجموع الكلي للمستودع (الرصيد الصافي الفعلي)</td>
                <td className="p-3 text-center bg-indigo-950 text-indigo-300 text-sm">
                  {totalNetKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم
                </td>
                <td className="p-3 text-center bg-indigo-950 text-indigo-300 text-sm">
                  {totalNetCones.toLocaleString('ar-EG')}
                </td>
                <td colSpan={canEdit ? 3 : 2} className="p-3 text-center text-slate-400">
                  رصيد مخزني حقيقي صافي
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action Guidance Footer Card */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">تحتاج لصرف كميات إلى صالات النسيج وأقسام التشغيل؟</span>
            <p className="text-slate-500 dark:text-slate-400">انتقل لصفحة سحوبات الأقسام لتسجيل إذن سحب رسمي وتنزيل الكميات من المخزون فوراً.</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('withdrawals')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 shadow-sm"
        >
          انتقال للسحوبات
        </button>
      </div>

      {/* Add / Edit Stock Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'تعديل بيانات صنف في المستودع' : 'إضافة صنف غزل جديد للمستودع'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingItem ? `تعديل الصنف ${editingItem.yarnCount}` : 'إدخال صنف جديد مع تخصيص رقم اللوط والأوزان'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Yarn Count */}
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">نمرة الخيط (Yarn Count):</label>
                  <input
                    type="text"
                    value={formData.yarnCount}
                    onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })}
                    placeholder="مثال: Ne 7.4 Open End أو Ne 20/1"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono font-bold"
                    required
                  />
                </div>

                {/* Lot Number */}
                <div className="space-y-1">
                  <label className="font-bold text-amber-800 dark:text-amber-300">رقم اللوط (Lot No.):</label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    placeholder="مثال: LOT-7401"
                    className="w-full p-2.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono font-bold"
                    required
                  />
                </div>

                {/* Origin */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">المصدر (Origin):</label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value as OriginCode })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-semibold"
                  >
                    <option value="TR">تركيا (TR)</option>
                    <option value="EG">مصر (EG)</option>
                    <option value="SYR">سوريا (SYR)</option>
                  </select>
                </div>

                {/* Cone Length */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">طول الكونة (متر):</label>
                  <input
                    type="number"
                    value={formData.coneLength}
                    onChange={(e) => setFormData({ ...formData, coneLength: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono"
                    min="1000"
                    step="500"
                    required
                  />
                </div>

                {/* Usage Category */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">الاستخدام (Category):</label>
                  <select
                    value={formData.usage}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-semibold"
                  >
                    <option value="WEFT DEN">WEFT DEN (لحمة دنيم)</option>
                    <option value="WARP DEN">WARP DEN (سداء دنيم)</option>
                    <option value="WEFT GR">WEFT GR (لحمة غبردين)</option>
                    <option value="WARP GR">WARP GR (سداء غبردين)</option>
                    <option value="WARP GR +DEN">WARP GR +DEN (سداء غبردين + دنيم)</option>
                  </select>
                </div>

                {/* Total Received KG */}
                <div className="space-y-1">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">إجمالي كمية المستلم الكلية (KG):</label>
                  <input
                    type="number"
                    value={formData.totalReceivedKg}
                    onChange={(e) => setFormData({ ...formData, totalReceivedKg: Number(e.target.value) })}
                    className="w-full p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono font-bold"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>

                {/* Total Received Cones */}
                <div className="space-y-1">
                  <label className="font-bold text-indigo-700 dark:text-indigo-300">إجمالي الكونات المستلمة:</label>
                  <input
                    type="number"
                    value={formData.totalReceivedCones}
                    onChange={(e) => setFormData({ ...formData, totalReceivedCones: Number(e.target.value) })}
                    className="w-full p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono font-bold"
                    min="0"
                    required
                  />
                </div>

                {/* Min Stock Alert */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">حد التنبيه بالانخفاض (KG):</label>
                  <input
                    type="number"
                    value={formData.minStockKg}
                    onChange={(e) => setFormData({ ...formData, minStockKg: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-mono"
                    min="100"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">الملاحظات:</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أي ملاحظات إضافية على الصنف أو المورد..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'حفظ التعديلات وتسجيل بالحدث' : 'إضافة الصنف وتحديث المستودع'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultDataType="stock"
      />

    </div>
  );
};
