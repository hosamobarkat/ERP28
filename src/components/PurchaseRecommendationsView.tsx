import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Clock 
} from 'lucide-react';
import { PurchaseRecommendation, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface PurchaseRecommendationsViewProps {
  userRole: UserRole;
  onNavigateToTab: (tab: any) => void;
}

export const PurchaseRecommendationsView: React.FC<PurchaseRecommendationsViewProps> = ({
  userRole,
  onNavigateToTab
}) => {
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>([]);

  useEffect(() => {
    const recs = storageService.generatePurchaseRecommendations();
    setRecommendations(recs);
  }, []);

  const handleCreatePoFromRecommendation = (rec: PurchaseRecommendation) => {
    if (window.confirm(`هل ترغب في إنشاء طلبية شراء بمقدار ${rec.suggestedOrderKg} كجم من ${rec.yarnCount} (${rec.origin})؟`)) {
      storageService.addPurchaseOrder({
        yarnCount: rec.yarnCount,
        origin: rec.origin,
        coneLength: rec.coneLength,
        totalRequiredWeightKg: rec.suggestedOrderKg,
        receivedWeightKg: 0,
        receivedConesCount: 0,
        expectedReadinessDate: rec.suggestedOrderDate,
        status: 'approved',
        notes: `توصية شراء تلقائية بناءً على السبب: ${rec.reason}`
      });

      alert('تم إنشاء طلبية الشراء بنجاح وسُجلت في جدول المشتريات!');
      onNavigateToTab('purchases');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
              محرك خوارزميات المشتريات الذكي
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              توصيات الشراء وتنبيهات إعادة الطلب
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              يقوم النظام بتحليل معدلات الاستهلاك الشهري، مقارنة رصيد المستودع الحالي بالحد الأدنى، واحتساب الشحنات المعلقة لتحديد الكميات والمواعيد الدقيقة للشراء قبل حدوث أي نفاذ بالمخزون.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">المخزون بوضع ممتازة</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              جميع أصناف الغزل متوفرة بكميات تتجاوز حدود الأمان الدنيا مع وجود طلبيات توريد تغطي الاستهلاك المخطط.
            </p>
          </div>
        ) : (
          recommendations.map((rec, index) => {
            const isHigh = rec.urgency === 'HIGH';
            const isMedium = rec.urgency === 'MEDIUM';

            return (
              <div 
                key={index}
                className={`p-5 rounded-2xl border transition-all shadow-xs bg-white dark:bg-slate-800 ${
                  isHigh 
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200 dark:ring-rose-950/40' 
                    : isMedium 
                    ? 'border-amber-300 dark:border-amber-900/60' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Specs & Info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isHigh 
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                        : isMedium 
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' 
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isHigh 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : isMedium 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isHigh ? 'أولوية قصوى (حرجة)' : isMedium ? 'أولوية متوسطة' : 'اعتيادية'}
                        </span>
                        <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                          المصدر: {rec.origin} | طول الكونة: {rec.coneLength}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rec.yarnCount}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {rec.reason}
                      </p>
                    </div>
                  </div>

                  {/* Middle Metrics */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl text-center text-xs border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الرصيد المتاح</span>
                      <strong className="text-slate-900 dark:text-white block font-black">{rec.currentStockKg} كجم</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">تحت الطلب</span>
                      <strong className="text-amber-600 dark:text-amber-400 block font-black">{rec.pendingPoKg} كجم</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الكمية الموصى بها</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 block font-black text-sm">{rec.suggestedOrderKg} كجم</strong>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-center gap-2">
                    <button
                      onClick={() => handleCreatePoFromRecommendation(rec)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إنشاء طلبية بمقدار {rec.suggestedOrderKg} كجم</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      موعد الشراء المقترح: {rec.suggestedOrderDate}
                    </span>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
