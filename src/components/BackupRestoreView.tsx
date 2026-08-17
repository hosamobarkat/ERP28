import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileJson, 
  RefreshCw, 
  Clock, 
  Lock, 
  ShieldAlert, 
  ArrowRight, 
  Check, 
  Layers, 
  FileSpreadsheet, 
  Activity, 
  Info,
  Server,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { backupService, ValidationResult, FullBackupPayload } from '../services/backupService';
import { storageService } from '../services/storageService';

interface BackupRestoreViewProps {
  userRole: UserRole;
  userName?: string;
  onNavigateToTab?: (tab: any) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  userRole,
  userName = 'مدير النظام',
  onNavigateToTab
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportInfo, setLastExportInfo] = useState<{ filename: string; timestamp: string; counts: any } | null>(null);

  // File Upload & Inspection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [parsedBackupPayload, setParsedBackupPayload] = useState<FullBackupPayload | null>(null);

  // Restore flow state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessInfo, setRestoreSuccessInfo] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'admin';

  // 1. Export JSON Full Backup
  const handleCreateAndDownloadBackup = () => {
    try {
      setIsExporting(true);
      const result = backupService.downloadFullBackup(userName, userRole);
      setLastExportInfo({
        filename: result.filename,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        counts: result.counts
      });
    } catch (error: any) {
      alert('حدث خطأ أثناء إنشاء وتنزيل النسخة الاحتياطية: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous states
    setSelectedFile(file);
    setValidationResult(null);
    setParsedBackupPayload(null);
    setRestoreError(null);
    setRestoreSuccessInfo(null);

    // Read and inspect file immediately
    inspectFile(file);
  };

  // 3. Inspect and Validate Backup JSON
  const inspectFile = (file: File) => {
    setIsInspecting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = backupService.validateBackup(text);
        setValidationResult(validation);

        if (validation.isValid && validation.data && validation.metadata) {
          setParsedBackupPayload({
            metadata: validation.metadata,
            data: validation.data
          });
        }
      } catch (err: any) {
        setValidationResult({
          isValid: false,
          errors: ['تعذر قراءة محتوى الملف: ' + err.message],
          warnings: []
        });
      } finally {
        setIsInspecting(false);
      }
    };

    reader.onerror = () => {
      setValidationResult({
        isValid: false,
        errors: ['حدث خطأ أثناء قراءة الملف من جهازك'],
        warnings: []
      });
      setIsInspecting(false);
    };

    reader.readAsText(file);
  };

  // 4. Trigger Pre-restore Confirmation Modal
  const handleInitiateRestore = () => {
    if (!isAdmin) {
      alert('عذراً، عملية استعادة النسخة الاحتياطية مقتصرة على مدير النظام (Admin) فقط.');
      return;
    }

    if (!parsedBackupPayload || !validationResult?.isValid) {
      alert('يرجى فحص واختيار ملف نسخة احتياطية صالح أولاً.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // 5. Execute Atomic Restore
  const handleExecuteRestore = () => {
    if (!parsedBackupPayload) return;

    setIsRestoring(true);
    setRestoreError(null);

    // Give UI a moment to show loading state
    setTimeout(() => {
      try {
        const result = backupService.restoreFullBackup(parsedBackupPayload, userName, userRole);

        if (result.success) {
          setRestoreSuccessInfo({
            timestamp: new Date().toLocaleTimeString('ar-EG'),
            counts: result.restoredCounts,
            metadata: parsedBackupPayload.metadata
          });
          setIsConfirmModalOpen(false);
          // Clear input file
          if (fileInputRef.current) fileInputRef.current.value = '';
          setSelectedFile(null);
          setValidationResult(null);
          setParsedBackupPayload(null);
        } else {
          setRestoreError(result.message || 'فشلت عملية الاستعادة.');
          setIsConfirmModalOpen(false);
        }
      } catch (err: any) {
        setRestoreError('حدث خطأ غير متوقع أثناء الاستعادة: ' + (err.message || ''));
        setIsConfirmModalOpen(false);
      } finally {
        setIsRestoring(false);
      }
    }, 300);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  النسخ الاحتياطي والاستعادة
                </h1>
                <p className="text-indigo-200 text-xs sm:text-sm font-medium">
                  حماية بيانات مستودع الغزول وتجهيزها للترحيل السحابي (Migration Ready)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
              <span className="text-slate-300 block">الصلاحية الحالية:</span>
              <span className="font-black text-emerald-400">
                {isAdmin ? 'مدير النظام (كامل الصلاحيات)' : 'مستخدم (تصدير فقط)'}
              </span>
            </div>
            
            <button
              onClick={handleCreateAndDownloadBackup}
              disabled={isExporting}
              className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>إنشاء وتحميل نسخة كاملة (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner after Restore */}
      {restoreSuccessInfo && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                  تمت استعادة النسخة الاحتياطية بنجاح والتحقق من سلامة كافة السجلات!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  تم تحديث الذاكرة المحلية والتحقق من مطابقة الأرصدة وحركات المخزون مع النسخة المصدرية بدون أي فقد في المعرفات (IDs) أو التواريخ.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    طلبات شراء: {restoreSuccessInfo.counts?.purchases}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    أصناف المخزون: {restoreSuccessInfo.counts?.stock}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    أذونات الصرف: {restoreSuccessInfo.counts?.withdrawals}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    حركات المخزون: {restoreSuccessInfo.counts?.movements}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة تحميل الصفحة الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {restoreError && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 dark:text-rose-100">
                فشل في تنفيذ الاستعادة
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                {restoreError}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                (تمت حماية بياناتك السابقة بالكامل ولم يتم مسح أو إتلاف أي سجلات بفضل نظام التراجع التلقائي).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMN 1: Export Full Backup */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  1. إنشاء وتصدير النسخة الاحتياطية
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  توليد ملف JSON متكامل يتضمن كافة الجداول والسجلات التاريخية
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>تنسيق النسخة:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">YARN_ERP_FULL_BACKUP v1.0</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>نوع التشفير وسلامة البيانات:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">CRC-32 Integrity Hash Check</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>النطاق المحمي:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">جميع الجداول (6 Storage Keys)</span>
              </div>
            </div>

            {/* List of included collections */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                المجموعات والبيانات المتضمنة في النسخة:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>طلبات الشراء والتوريد</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>رصيد المستودع الفعلي</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>أذونات سحب الأقسام</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>دفتر حركات المخزون</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>تنبيهات النظام</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>سجلات التدقيق والأمان</span>
                </div>
              </div>
            </div>

            {/* Last export confirmation */}
            {lastExportInfo && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <div>
                  <span className="font-bold block">تم تصدير نسخة بنجاح:</span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{lastExportInfo.filename}</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border">
                  {lastExportInfo.timestamp}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleCreateAndDownloadBackup}
              disabled={isExporting}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>تنزيل النسخة الاحتياطية الكاملة (JSON Backup)</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              الملف الناتج صالح للاستعادة على أي جهاز آخر أو للترحيل لقواعد بيانات سحابية (PostgreSQL / Supabase).
            </p>
          </div>
        </div>

        {/* COLUMN 2: Import & Restore */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    2. فحص واستعادة النسخة الاحتياطية
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    استيراد ملف JSON والتحقق الصارم من هيكليته قبل التطبيق
                  </p>
                </div>
              </div>

              {!isAdmin && (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-black flex items-center gap-1 border border-rose-300">
                  <Lock className="w-3 h-3" />
                  <span>خاص بالمدير</span>
                </span>
              )}
            </div>

            {/* File Drop / Select Area */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-upload"
              />
              <label
                htmlFor="backup-file-upload"
                className={`w-full p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                }`}
              >
                <FileJson className={`w-8 h-8 mb-2 ${selectedFile ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف النسخة الاحتياطية (JSON)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {selectedFile ? `الحجم: ${(selectedFile.size / 1024).toFixed(1)} كيلوبايت` : 'يدعم فقط ملفات YARN_ERP_FULL_BACKUP.json'}
                </span>
              </label>
            </div>

            {/* Validation State Display */}
            {isInspecting && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>جاري فحص وتدقيق بنية الملف والتأكد من سلامة المعرفات...</span>
              </div>
            )}

            {validationResult && (
              <div className={`p-4 rounded-2xl text-xs space-y-3 border ${
                validationResult.isValid
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
              }`}>
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                        تم التحقق بنجاح: ملف نسخة احتياطية صالح ومتطابق
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-extrabold text-rose-900 dark:text-rose-200">
                        الملف المحدد غير صالح أو تالف
                      </span>
                    </>
                  )}
                </div>

                {/* Show Metadata if valid */}
                {validationResult.isValid && validationResult.metadata && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 text-[11px]">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>تاريخ إنشاء النسخة:</span>
                      <span className="font-mono font-bold">{new Date(validationResult.metadata.exportedAt).toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>بواسطة:</span>
                      <span className="font-bold">{validationResult.metadata.exportedBy?.userName || 'غير محدد'} ({validationResult.metadata.exportedBy?.userRole})</span>
                    </div>

                    {/* Summary of record counts */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 font-mono text-[10px] text-center">
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">مشتريات</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.purchases}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">مخزون</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.stock}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">سحوبات</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.withdrawals}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">حركات</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.movements}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">تنبيهات</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.notifications}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60">
                        <span className="text-slate-400 block">تدقيق</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{validationResult.previewCounts?.auditLogs}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors list if any */}
                {validationResult.errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-rose-700 dark:text-rose-300 text-[11px] pt-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}

                {/* Warnings list if any */}
                {validationResult.warnings.length > 0 && (
                  <div className="text-amber-700 dark:text-amber-300 text-[10px] space-y-0.5 pt-1">
                    {validationResult.warnings.map((w, i) => (
                      <div key={i}>⚠️ {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Area */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleInitiateRestore}
              disabled={!validationResult?.isValid || !isAdmin || isRestoring}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                validationResult?.isValid && isAdmin
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>استعادة البيانات من هذه النسخة (Restore)</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              {isAdmin
                ? 'سيتم عمل لقطة أمان مؤقتة قبل الاستبدال لتفادي أي انقطاع وضمان الاستعادة بنسبة 100%.'
                : 'زر الاستعادة مقفل ويتطلب تسجيل الدخول بحساب مدير النظام (Admin).'}
            </p>
          </div>
        </div>

      </div>

      {/* Migration & Technical Overview Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-sm">
          <Server className="w-4 h-4 text-indigo-500" />
          <span>جاهزية الترحيل لقواعد البيانات السحابية (Cloud Migration Readiness)</span>
        </div>
        <p className="leading-relaxed">
          ملف النسخة الاحتياطية المهيكل (JSON) تم تصميمه بمعايير قواعد البيانات العلائقية (Relational Schemas)؛ حيث يحتفظ بكافة المعرفات الفريدة (IDs)، والمفاتيح المرجعية، وأرقام اللوطات، وسجل الأستاذ العام للحركات التاريخية، مما يتيح استيراده مباشرة كـ Seed Data أو Migration ETL إلى أي قاعدة بيانات مستقبلية (PostgreSQL / Supabase / MySQL) دون فقدان أي سجل.
        </p>
      </div>

      {/* CONFIRMATION RESTORE MODAL */}
      {isConfirmModalOpen && validationResult?.isValid && validationResult.metadata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تأكيد استعادة النسخة الاحتياطية
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  يرجى قراءة التحذير أدناه بعناية قبل المتابعة
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed">
              <p className="font-bold">
                ⚠️ تحذير: استعادة هذه النسخة ستستبدل بيانات النظام الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية.
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                يقوم النظام تلقائياً بإنشاء لقطة أمان مؤقتة (Pre-Restore Snapshot) قبل البدء لضمان التراجع التلقائي في حال حدوث أي خطأ في الكتابة.
              </p>
            </div>

            {/* Quick backup button before confirm */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs">
              <span className="text-slate-600 dark:text-slate-300">هل ترغب بحفظ نسختك الحالية أولاً؟</span>
              <button
                onClick={handleCreateAndDownloadBackup}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>حفظ الحالة الحالية الآن</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-amber-600/25 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الاستعادة والتحقق...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>متابعة الاستعادة الآن</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
