import React from 'react';
import { X, AlertOctagon, AlertTriangle, CheckCircle2, Cpu, ClipboardList } from 'lucide-react';
import { Loom, ProductionOrder } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  looms: Loom[];
  orders: ProductionOrder[];
  onSelectTab: (tab: any) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  looms,
  orders,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const stoppedLooms = looms.filter((l) => l.status === 'stopped' || l.status === 'maintenance');
  const delayedOrders = orders.filter((o) => o.status === 'delayed');
  const nearCompletionOrders = orders.filter(
    (o) =>
      o.status === 'in_progress' &&
      o.requiredQuantityMeters > 0 &&
      o.producedQuantityMeters / o.requiredQuantityMeters >= 0.9
  );

  const notifications = [
    ...delayedOrders.map((o) => ({
      type: 'order_delayed',
      title: `أمر إنتاج متأخر: ${o.orderNumber}`,
      desc: `الصنف: ${o.fabricItemName || 'صنف'} - المتبقي: ${(o.requiredQuantityMeters - o.producedQuantityMeters).toLocaleString()} متر`,
      icon: AlertOctagon,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      tab: 'orders',
    })),
    ...nearCompletionOrders.map((o) => ({
      type: 'order_near_complete',
      title: `أمر إنتاج شارف على الانتهاء (90%+): ${o.orderNumber}`,
      desc: `تم إنجاز ${Math.round((o.producedQuantityMeters / o.requiredQuantityMeters) * 100)}% من الكمية المطلوب.`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      tab: 'orders',
    })),
    ...stoppedLooms.map((l) => ({
      type: 'loom_stopped',
      title: `نول ${l.loomNumber} (${l.hallName}) متوقف أو تحت الصيانة`,
      desc: `الحالة: ${l.status === 'stopped' ? 'متوقف' : 'صيانة'} - ${l.notes || 'لا يوجد ملاحظات'}`,
      icon: Cpu,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      tab: 'monitoring',
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              تنبيهات النظام ({notifications.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
              <p className="text-sm font-medium">لا توجد تنبيهات عاجلة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">جميع الأنوال وأوامر الإنتاج تعمل بشكل طبيعي</p>
            </div>
          ) : (
            notifications.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${item.color}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold leading-snug">{item.title}</h4>
                      <p className="text-[11px] opacity-90 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
