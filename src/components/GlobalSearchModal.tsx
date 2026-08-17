import React, { useState } from 'react';
import { Search, X, ShoppingCart, Warehouse, ArrowUpRight, ArrowRight } from 'lucide-react';
import { PurchaseOrderItem, WarehouseStockItem, Withdrawal } from '../types';
import { calculatePOTolerance } from '../utils/poUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseOrderItem[];
  stock: WarehouseStockItem[];
  withdrawals: Withdrawal[];
  onNavigateToTab: (tab: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  purchases,
  stock,
  withdrawals,
  onNavigateToTab
}) => {
  const [term, setTerm] = useState('');

  if (!isOpen) return null;

  const q = term.toLowerCase().trim();

  const matchedPurchases = q ? purchases.filter(p => 
    p.yarnCount.toLowerCase().includes(q) ||
    p.origin.toLowerCase().includes(q) ||
    (p.poNumber && p.poNumber.toLowerCase().includes(q))
  ) : [];

  const matchedStock = q ? stock.filter(s => 
    s.yarnCount.toLowerCase().includes(q) ||
    s.origin.toLowerCase().includes(q) ||
    (s.usage && s.usage.toLowerCase().includes(q))
  ) : [];

  const matchedWithdrawals = q ? withdrawals.filter(w => 
    w.yarnCount.toLowerCase().includes(q) ||
    w.department.toLowerCase().includes(q) ||
    w.withdrawalNumber.toLowerCase().includes(q)
  ) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute right-4 text-indigo-500" />
          <input
            type="text"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="اكتب نمرة الخيط (مثل Ne 8)، المصدر (TR أو EG)، أو القسم..."
            className="w-full pr-12 pl-10 py-3.5 text-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-indigo-500/30 focus:outline-hidden font-bold"
          />
          <button onClick={onClose} className="absolute left-3 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto space-y-4 text-xs">
          {!q ? (
            <div className="p-8 text-center text-slate-400">
              ادخل كلمة البحث لاستعراض النتائج المباشرة من كافة أقسام ERP.
            </div>
          ) : (
            <>
              {/* Purchases Results */}
              {matchedPurchases.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 px-1">
                    <ShoppingCart className="w-4 h-4" />
                    المشتريات والطلبيات ({matchedPurchases.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedPurchases.slice(0, 3).map(p => {
                      const tol = calculatePOTolerance(p.totalRequiredWeightKg, p.receivedWeightKg);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => { onNavigateToTab('purchases'); onClose(); }}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border border-slate-100 dark:border-slate-800"
                        >
                          <div>
                            <strong className="text-slate-900 dark:text-white block">{p.yarnCount}</strong>
                            <span className="text-[10px] text-slate-500">
                              المطلوب: {p.totalRequiredWeightKg} كجم | تحت الطلب: {tol.pendingWeightKg} كجم {tol.isCompleted && '(تم الاستلام)'}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Results */}
              {matchedStock.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-1">
                    <Warehouse className="w-4 h-4" />
                    المستودع والمخزون الحقيقي ({matchedStock.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedStock.slice(0, 3).map(s => (
                      <div 
                        key={s.id}
                        onClick={() => { onNavigateToTab('warehouse'); onClose(); }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border border-slate-100 dark:border-slate-800"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{s.yarnCount} ({s.origin})</strong>
                          <span className="text-[10px] text-slate-500">الرصيد الصافي المتاح: <b className="text-emerald-600">{s.netWeightKg} كجم</b> ({s.netCones} كونة)</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withdrawals Results */}
              {matchedWithdrawals.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 px-1">
                    <ArrowUpRight className="w-4 h-4" />
                    السحوبات وصالات التشغيل ({matchedWithdrawals.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedWithdrawals.slice(0, 3).map(w => (
                      <div 
                        key={w.id}
                        onClick={() => { onNavigateToTab('withdrawals'); onClose(); }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-purple-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between border border-slate-100 dark:border-slate-800"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{w.yarnCount} - إذن {w.withdrawalNumber}</strong>
                          <span className="text-[10px] text-slate-500">قسم: {w.department} | المسحوب: {w.withdrawnKg} كجم</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedPurchases.length === 0 && matchedStock.length === 0 && matchedWithdrawals.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  لم يتم العثور على أي بيانات تطابق عبارة البحث "{term}"
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
