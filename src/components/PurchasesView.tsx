import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Filter, 
  PackageCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  ArrowDownLeft,
  Upload,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PurchaseOrderItem, OrderStatus, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { exportPurchasesToExcel } from '../utils/exportUtils';
import { ExcelImportModal } from './ExcelImportModal';
import { calculatePOTolerance, parseExcelDate, checkDelayedPurchaseOrder, DelayedPOInfo } from '../utils/poUtils';

interface PurchasesViewProps {
  purchases: PurchaseOrderItem[];
  userRole: UserRole;
  searchQuery: string;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  userRole,
  searchQuery
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [delayedUrgencyFilter, setDelayedUrgencyFilter] = useState<'ALL' | 'high' | 'medium' | 'low'>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [receivingPoItem, setReceivingPoItem] = useState<PurchaseOrderItem | null>(null);

  // New PO Form
  const [newPo, setNewPo] = useState({
    yarnCount: '',
    origin: 'TR',
    coneLength: 44000,
    warpConesCount: 0,
    weftWeight: 0,
    totalRequiredWeightKg: 10000,
    receivedWeightKg: 0,
    receivedConesCount: 0,
    expectedReadinessDate: '2026-08-15',
    status: 'approved' as OrderStatus,
    notes: ''
  });

  // Goods Receiving Form
  const [receivingKg, setReceivingKg] = useState<number>(0);
  const [receivingCones, setReceivingCones] = useState<number>(0);
  const [receivingNotes, setReceivingNotes] = useState<string>('');

  // Total available base records (showing all purchases without filtering)
  const activeBasePurchases = purchases;

  // Delayed POs calculation
  const delayedPOs = useMemo(() => {
    return activeBasePurchases
      .map(po => checkDelayedPurchaseOrder(po))
      .filter((d): d is DelayedPOInfo => d !== null);
  }, [activeBasePurchases]);

  const highUrgencyCount = delayedPOs.filter(d => d.urgencyLevel === 'high').length;
  const mediumUrgencyCount = delayedPOs.filter(d => d.urgencyLevel === 'medium').length;
  const lowUrgencyCount = delayedPOs.filter(d => d.urgencyLevel === 'low').length;
  const totalDelayedWeightKg = delayedPOs.reduce((sum, d) => sum + d.pendingWeightKg, 0);

  // Combined Search & Filter
  const effectiveSearch = localSearch || searchQuery;
  
  const filteredPurchases = activeBasePurchases.filter(item => {
    const matchSearch = 
      item.yarnCount.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      item.origin.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      (item.poNumber && item.poNumber.toLowerCase().includes(effectiveSearch.toLowerCase()));

    const tol = calculatePOTolerance(item.totalRequiredWeightKg, item.receivedWeightKg);
    const delayedInfo = checkDelayedPurchaseOrder(item);

    const matchStatus = (() => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED' || statusFilter === 'completed') return tol.isCompleted;
      if (statusFilter === 'DELAYED') {
        if (!delayedInfo) return false;
        if (delayedUrgencyFilter === 'ALL') return true;
        return delayedInfo.urgencyLevel === delayedUrgencyFilter;
      }
      if (statusFilter === 'INCOMPLETE' || statusFilter === 'partially_received' || statusFilter === 'approved') {
        if (tol.isCompleted) return false;
        if (delayedUrgencyFilter !== 'ALL') {
          return delayedInfo?.urgencyLevel === delayedUrgencyFilter;
        }
        return true;
      }
      return item.status === statusFilter;
    })();

    const matchOrigin = originFilter === 'ALL' || item.origin === originFilter;

    return matchSearch && matchStatus && matchOrigin;
  });

  // Totals
  const totalRequiredWeight = filteredPurchases.reduce((s, i) => s + (i.totalRequiredWeightKg || 0), 0);
  const totalReceivedWeight = filteredPurchases.reduce((s, i) => s + (i.receivedWeightKg || 0), 0);
  const totalPendingWeight = filteredPurchases.reduce((s, i) => {
    const tol = calculatePOTolerance(i.totalRequiredWeightKg, i.receivedWeightKg);
    return s + tol.pendingWeightKg;
  }, 0);
  const totalReceivedCones = filteredPurchases.reduce((s, i) => s + (i.receivedConesCount || 0), 0);

  const incompleteCount = activeBasePurchases.filter(p => !calculatePOTolerance(p.totalRequiredWeightKg, p.receivedWeightKg).isCompleted).length;

  const canEdit = userRole === 'admin' || userRole === 'production' || userRole === 'warehouse_manager';

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPo.yarnCount.trim()) {
      alert('يرجى إدخال نمرة الخيط');
      return;
    }
    storageService.addPurchaseOrder({
      ...newPo,
      warpConesCount: newPo.warpConesCount || undefined,
      weftWeight: newPo.weftWeight || undefined
    });
    setIsAddModalOpen(false);
  };

  const handleOpenReceiving = (item: PurchaseOrderItem) => {
    const tol = calculatePOTolerance(item.totalRequiredWeightKg, item.receivedWeightKg);
    setReceivingPoItem(item);
    setReceivingKg(Math.max(0, tol.pendingWeightKg));
    setReceivingCones(Math.round(Math.max(0, tol.pendingWeightKg) / (item.coneLength / 1000) || 0));
    setReceivingNotes('استلام شحنة واردة');
  };

  const handleConfirmReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPoItem) return;
    if (receivingKg <= 0) {
      alert('يرجى تحديد وزن الاستلام أكبر من صفر');
      return;
    }

    try {
      storageService.processGoodsReceiving(receivingPoItem.id, receivingKg, receivingCones, receivingNotes);
      setReceivingPoItem(null);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء معالجة الاستلام');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header & Main Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">جدول المشتريات والطلبيات</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل متابعة طلبيات الشراء والأوزان تحت الطلب مع احتساب تم الاستلام وتحت الطلب تلقائياً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            title="استيراد وتحديث جدول المشتريات من ملف إكسل"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد من Excel</span>
          </button>

          <button
            onClick={() => exportPurchasesToExcel(filteredPurchases)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طلبية جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="بحث بنمرة الخيط، رقم الطلب، أو المورد..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value !== 'INCOMPLETE' && e.target.value !== 'DELAYED') {
                setDelayedUrgencyFilter('ALL');
              }
            }}
            className="w-full py-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-hidden font-medium"
          >
            <option value="ALL">جميع الحالات ({activeBasePurchases.length})</option>
            <option value="INCOMPLETE">طلبات غير مكتملة تحت الطلب ({incompleteCount})</option>
            <option value="DELAYED">🚨 متأخرة عن موعد الجاهزية ({delayedPOs.length})</option>
            <option value="COMPLETED">مكتملة ومستلمة بالكامل ({activeBasePurchases.length - incompleteCount})</option>
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
          عرض <b className="font-bold text-indigo-600 dark:text-indigo-400 mx-1">{filteredPurchases.length}</b> من أصل <b className="font-bold text-slate-800 dark:text-slate-200 mx-1">{activeBasePurchases.length}</b> طلبية
        </div>
      </div>

      {/* INTEGRATED OVERDUE ORDERS TRACKING SECTION (Visible in Incomplete / Delayed views or when delayed orders exist) */}
      {(statusFilter === 'INCOMPLETE' || statusFilter === 'DELAYED' || (delayedPOs.length > 0 && statusFilter === 'ALL')) && (
        <div className="bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-white dark:from-rose-950/30 dark:via-slate-800/80 dark:to-slate-800 rounded-2xl p-4 sm:p-5 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    متابعة الطلبيات المتأخرة عن موعد الجاهزية المتوقع
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-black text-[11px] border border-rose-300 dark:border-rose-700">
                    {delayedPOs.length} طلبية متأخرة
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  إجمالي الأوزان المعلقة المتأخرة عن تاريخ الجاهزية: <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold">{totalDelayedWeightKg.toLocaleString('ar-EG')} كجم</strong>
                </p>
              </div>
            </div>

            {/* Quick Urgency Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => {
                  setStatusFilter(statusFilter === 'DELAYED' ? 'INCOMPLETE' : 'DELAYED');
                  setDelayedUrgencyFilter('ALL');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'DELAYED' && delayedUrgencyFilter === 'ALL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                }`}
              >
                المتأخرة فقط ({delayedPOs.length})
              </button>

              <button
                onClick={() => {
                  setStatusFilter('DELAYED');
                  setDelayedUrgencyFilter('high');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  statusFilter === 'DELAYED' && delayedUrgencyFilter === 'high'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>حرج &gt;14 يوم ({highUrgencyCount})</span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('DELAYED');
                  setDelayedUrgencyFilter('medium');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  statusFilter === 'DELAYED' && delayedUrgencyFilter === 'medium'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <span>متوسط 7-14 يوم ({mediumUrgencyCount})</span>
              </button>

              <button
                onClick={() => {
                  setStatusFilter('DELAYED');
                  setDelayedUrgencyFilter('low');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 ${
                  statusFilter === 'DELAYED' && delayedUrgencyFilter === 'low'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <span>حديث &lt;7 أيام ({lowUrgencyCount})</span>
              </button>

              {delayedUrgencyFilter !== 'ALL' && (
                <button
                  onClick={() => setDelayedUrgencyFilter('ALL')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  title="إلغاء فلتر درجة التأخير"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Excel/PDF Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">م</th>
                <th className="p-3 border-l border-slate-200/60 dark:border-slate-800">نمرة الخيط</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">عدد البوبينات للسداء</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">طول الكونة</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">وزن الحدف</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-300">
                  الوزن الكلي المطلوب KG
                </th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">المصدر</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300">
                  تم استلام KG
                </th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                  تحت الطلب KG
                </th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">عدد البوبينات المستلمة</th>
                <th className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">تاريخ الجاهزية المتوقع</th>
                <th className="p-3 text-center min-w-[150px]">ملاحظات وحالة الاستلام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredPurchases.map((item, index) => {
                const tol = calculatePOTolerance(item.totalRequiredWeightKg, item.receivedWeightKg);
                const delayedInfo = checkDelayedPurchaseOrder(item);

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                      delayedInfo ? (
                        delayedInfo.urgencyLevel === 'high' 
                          ? 'bg-rose-50/30 dark:bg-rose-950/15' 
                          : delayedInfo.urgencyLevel === 'medium'
                          ? 'bg-amber-50/20 dark:bg-amber-950/10'
                          : 'bg-indigo-50/10 dark:bg-indigo-950/10'
                      ) : ''
                    }`}
                  >
                    <td className="p-3 text-center text-slate-400 border-l border-slate-100 dark:border-slate-800 font-mono">{index + 1}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {delayedInfo && (
                          <span 
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              delayedInfo.urgencyLevel === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            title={`طلبية متأخرة ${delayedInfo.daysDelayed} يوم`}
                          />
                        )}
                        <span>{item.yarnCount}</span>
                      </div>
                      {item.poNumber && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {item.poNumber} {item.lotNumber ? `| لوط: ${item.lotNumber}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800">
                      {item.warpConesCount ? item.warpConesCount.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono">
                      {item.coneLength ? item.coneLength.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800">
                      {item.weftWeight ? item.weftWeight.toLocaleString('ar-EG') : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-700 dark:text-indigo-300 border-l border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10 font-mono">
                      {item.totalRequiredWeightKg ? item.totalRequiredWeightKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3 text-center font-semibold border-l border-slate-100 dark:border-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.origin}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 border-l border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10 font-mono">
                      {item.receivedWeightKg ? item.receivedWeightKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '0'}
                    </td>
                    <td className="p-3 text-center font-bold border-l border-slate-100 dark:border-slate-800 bg-amber-50/20 dark:bg-amber-950/10">
                      <span className={tol.pendingWeightKg <= 0 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-mono'}>
                        {tol.pendingWeightKg > 0 ? tol.pendingWeightKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '0'}
                      </span>
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono">
                      {item.receivedConesCount ? item.receivedConesCount.toLocaleString('ar-EG') : '-'}
                    </td>
                    
                    {/* Expected Readiness Date & Delayed Badge */}
                    <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] font-mono">
                          {parseExcelDate(item.expectedReadinessDate)}
                        </span>
                        {delayedInfo && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${
                            delayedInfo.urgencyLevel === 'high'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                              : delayedInfo.urgencyLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                          }`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>تأخير {delayedInfo.daysDelayed} يوم</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status & Actions Cell */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {tol.isCompleted ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-extrabold text-[11px] shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>تم الاستلام</span>
                            </span>

                            {tol.isCompletedWithinTolerance && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                                مكتمـل (سماحية ±5%)
                              </span>
                            )}

                            {tol.isExcess && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 font-bold text-[10px]">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>تنبيه: كمية زائدة (+{tol.excessPercent}%)</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenReceiving(item)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs hover:shadow-sm"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span>استلام الشحنة</span>
                              </button>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium">
                              متبقي: <b className="font-mono">{tol.pendingWeightKg.toLocaleString('ar-EG')}</b> كجم
                            </span>
                            {delayedInfo && (
                              <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>مطلوب متابعة المورد</span>
                              </span>
                            )}
                          </div>
                        )}

                        {item.notes && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[130px] truncate" title={item.notes}>
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Summary Row matching PDF Page 1 */}
            <tfoot>
              <tr className="bg-indigo-900 text-white font-extrabold text-xs">
                <td colSpan={5} className="p-3 text-left pl-4">المجموع الكلي</td>
                <td className="p-3 text-center bg-indigo-950">
                  {totalRequiredWeight.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم
                </td>
                <td className="p-3 text-center"></td>
                <td className="p-3 text-center bg-emerald-950 text-emerald-300">
                  {totalReceivedWeight.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم
                </td>
                <td className="p-3 text-center bg-amber-950 text-amber-300">
                  {totalPendingWeight.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم
                </td>
                <td className="p-3 text-center">
                  {totalReceivedCones.toLocaleString('ar-EG')}
                </td>
                <td colSpan={2} className="p-3 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Purchase Order */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة طلبية شراء غزل جديدة</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">نمرة الخيط *</label>
                  <input
                    type="text"
                    required
                    value={newPo.yarnCount}
                    onChange={(e) => setNewPo({ ...newPo, yarnCount: e.target.value })}
                    placeholder="مثال: Ne 8 Carded Even"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">المصدر (Origin)</label>
                  <select
                    value={newPo.origin}
                    onChange={(e) => setNewPo({ ...newPo, origin: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="TR">TR (تركيا)</option>
                    <option value="EG">EG (مصر)</option>
                    <option value="SYR">SYR (سوريا)</option>
                    <option value="IN">IN (الهند)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">طول الكونة</label>
                  <input
                    type="number"
                    value={newPo.coneLength}
                    onChange={(e) => setNewPo({ ...newPo, coneLength: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">الوزن المطلوب KG *</label>
                  <input
                    type="number"
                    required
                    value={newPo.totalRequiredWeightKg}
                    onChange={(e) => setNewPo({ ...newPo, totalRequiredWeightKg: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">تاريخ الجاهزية</label>
                  <input
                    type="text"
                    value={newPo.expectedReadinessDate}
                    onChange={(e) => setNewPo({ ...newPo, expectedReadinessDate: e.target.value })}
                    placeholder="YYYY-MM-DD أو جرد"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  حفظ الطلبية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Goods Receiving */}
      {receivingPoItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">إستلام مشتريات واردة</h3>
              </div>
              <button onClick={() => setReceivingPoItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const currentRcvd = receivingPoItem.receivedWeightKg || 0;
              const projectedTotalKg = Math.round((currentRcvd + (receivingKg || 0)) * 100) / 100;
              const projectedTol = calculatePOTolerance(receivingPoItem.totalRequiredWeightKg, projectedTotalKg);

              return (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl my-4 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-900 dark:text-white">{receivingPoItem.yarnCount}</p>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
                      {receivingPoItem.origin}
                    </span>
                  </div>
                  <p className="text-slate-500 flex justify-between">
                    <span>المطلوب الكلي: <strong className="text-indigo-600 dark:text-indigo-400">{receivingPoItem.totalRequiredWeightKg} كجم</strong></span>
                    <span>المستلم سابقاً: <strong className="text-emerald-600 dark:text-emerald-400">{currentRcvd} كجم</strong></span>
                  </p>

                  {/* Tolerance projected notification */}
                  {receivingKg > 0 && (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      {projectedTol.isCompletedWithinTolerance && (
                        <p className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>سيكتمل الطلب ضمن نسبة السماحية المقبولة (±5%) عند إجمالي {projectedTotalKg} كجم</span>
                        </p>
                      )}
                      {projectedTol.isExactOrNormalCompletion && !projectedTol.isCompletedWithinTolerance && (
                        <p className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>سيكتمل الطلب بنجاح عند إجمالي {projectedTotalKg} كجم</span>
                        </p>
                      )}
                      {projectedTol.isExcess && (
                        <p className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded-lg border border-amber-300 dark:border-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>تنبيه: الإجمالي ({projectedTotalKg} كجم) سيتجاوز المطلوب بزيادة أكبر من 5% (+{projectedTol.excessPercent}%)</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleConfirmReceiving} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">الوزن المستلم الفعلي (كجم) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={receivingKg}
                  onChange={(e) => setReceivingKg(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">عدد البوبينات المستلمة *</label>
                <input
                  type="number"
                  required
                  value={receivingCones}
                  onChange={(e) => setReceivingCones(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ملاحظات الإستلام</label>
                <input
                  type="text"
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setReceivingPoItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  تأكيد الإستلام وزيادة المخزون
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
        defaultDataType="purchases"
      />

    </div>
  );
};
