import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Download, 
  Layers, 
  RefreshCw,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { WarehouseStockItem, PurchaseOrderItem, OriginCode } from '../types';
import { storageService } from '../services/storageService';
import { calculatePOTolerance, parseExcelDate } from '../utils/poUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDataType?: 'stock' | 'purchases';
  onSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultDataType = 'stock',
  onSuccess
}) => {
  const [targetType, setTargetType] = useState<'stock' | 'purchases'>(defaultDataType);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTargetType(defaultDataType);
      setParsedRows([]);
      setFileName('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, defaultDataType]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, cellNF: false, cellText: false });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          setErrorMsg('الملف لا يحتوي على بيانات أو رأس أعمدة غير صالح.');
          setIsProcessing(false);
          return;
        }

        // Parse headers and rows
        const headers: string[] = (rawJson[0] as Array<any>).map(h => String(h || '').trim());
        const dataRows = rawJson.slice(1).filter((r: any) => r && r.length > 0);

        const mappedItems: any[] = [];

        dataRows.forEach((row: any) => {
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = row[idx];
          });

          if (targetType === 'stock') {
            // Map warehouse stock fields
            const yarnCount = String(
              rowObj['نمرة الخيط'] || rowObj['نمرة الخيط واسمه'] || rowObj['Yarn Count'] || rowObj['yarnCount'] || ''
            ).trim();

            if (!yarnCount || yarnCount === 'المجمع' || yarnCount === 'Total') return;

            const lotNumber = String(
              rowObj['اللوط'] || rowObj['رقم اللوط'] || rowObj['Lot'] || rowObj['lotNumber'] || ''
            ).trim();

            const origin = (
              rowObj['المصدر'] || rowObj['Origin'] || rowObj['origin'] || 'TR'
            ).toString().trim().toUpperCase().includes('EG') ? 'EG' : 
            (rowObj['المصدر'] || '').toString().trim().toUpperCase().includes('SYR') ? 'SYR' : 'TR';

            const coneLength = Number(
              rowObj['الطول في الكونة'] || rowObj['طول الكونة'] || rowObj['coneLength'] || 44000
            ) || 44000;

            const netWeightKg = Number(
              rowObj['إجمالي الوزن الصافي (كغ)'] || rowObj['إجمالي الوزن الصافي'] || rowObj['الوزن الصافي'] || rowObj['إجمالي المستلم KG'] || rowObj['netWeightKg'] || 0
            ) || 0;

            const netCones = Number(
              rowObj['إجمالي عدد الكونات'] || rowObj['عدد الكونات'] || rowObj['الكونات'] || rowObj['netCones'] || 0
            ) || 0;

            const usage = String(
              rowObj['الاستخدام'] || rowObj['نوع الاستخدام'] || rowObj['usage'] || 'WEFT GR'
            ).trim();

            mappedItems.push({
              yarnCount,
              lotNumber: lotNumber || 'LOT-MAIN',
              origin,
              coneLength,
              totalReceivedKg: netWeightKg,
              totalReceivedCones: netCones,
              netWeightKg,
              netCones,
              usage,
              warehouseName: 'مستودع الغزول الرئيسي'
            });

          } else {
            // Map purchase order fields
            const yarnCount = String(
              rowObj['نمرة الخيط'] || rowObj['اسم الخيط'] || rowObj['Yarn Count'] || rowObj['yarnCount'] || ''
            ).trim();

            if (!yarnCount || yarnCount === 'المجمع' || yarnCount === 'Total') return;

            const poNumber = String(
              rowObj['رقم الطلبية'] || rowObj['رقم امر الشراء'] || rowObj['PO Number'] || rowObj['poNumber'] || `PO-${Date.now()}`
            ).trim();

            const origin = (
              rowObj['المصدر'] || rowObj['Origin'] || rowObj['origin'] || 'TR'
            ).toString().trim().toUpperCase().includes('EG') ? 'EG' : 'TR';

            const coneLength = Number(
              rowObj['طول الكونة'] || rowObj['الطول في الكونة'] || rowObj['coneLength'] || 44000
            ) || 44000;

            const reqKg = Number(
              rowObj['الوزن الكلي المطلوب'] || rowObj['الوزن المطلوب'] || rowObj['Total Required'] || 0
            ) || 0;

            const rcvdKg = Number(
              rowObj['تم استلام KG'] || rowObj['الوزن المستلم'] || rowObj['Received Kg'] || 0
            ) || 0;

            const rcvdCones = Number(
              rowObj['عدد الببنات المستلمة'] || rowObj['عدد الكونات المستلمة'] || rowObj['Cones'] || 0
            ) || 0;

            const readinessRaw = rowObj['تاريخ الجاهزية المتوقع'] ?? rowObj['تاريخ الجاهزية'] ?? rowObj['تاريخ التسليم'] ?? 'جرد';
            const readinessDate = parseExcelDate(readinessRaw);

            const finalReqKg = reqKg || rcvdKg;
            const tol = calculatePOTolerance(finalReqKg, rcvdKg);

            mappedItems.push({
              poNumber,
              yarnCount,
              origin,
              coneLength,
              totalRequiredWeightKg: finalReqKg,
              receivedWeightKg: rcvdKg,
              pendingWeightKg: tol.pendingWeightKg,
              receivedConesCount: rcvdCones,
              expectedReadinessDate: readinessDate || 'جرد',
              status: tol.status
            });
          }
        });

        if (mappedItems.length === 0) {
          setErrorMsg('لم يتم التعرف على أي صفوف بيانات مطابقة للشروط.');
        } else {
          setParsedRows(mappedItems);
        }
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setErrorMsg('حدث خطأ أثناء قراءة ملف Excel: ' + (err.message || 'تنسيق غير مدعوم'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    try {
      if (targetType === 'stock') {
        storageService.importStockFromExcel(parsedRows, importMode === 'replace');
        setSuccessMsg(`تم استيراد ${parsedRows.length} سجل بنجاح إلى جدول جرد المستودع!`);
      } else {
        storageService.importPurchasesFromExcel(parsedRows, importMode === 'replace');
        setSuccessMsg(`تم استيراد ${parsedRows.length} طلب شراء بنجاح إلى جدول المشتريات!`);
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        window.location.reload();
      }, 1200);

    } catch (err: any) {
      setErrorMsg('فشل الاستيراد: ' + (err.message || 'خطأ غير معروف'));
    }
  };

  const handleDownloadTemplate = () => {
    let templateData: any[] = [];
    let filename = '';

    if (targetType === 'stock') {
      filename = 'نموذج_جرد_المستودع.xlsx';
      templateData = [
        {
          'نمرة الخيط واسمه': 'Ne 7.4 Open End',
          'اللوط': '2135-1',
          'المصدر': 'TR',
          'الطول في الكونة': 44000,
          'إجمالي عدد الكونات': 12264,
          'إجمالي الوزن الصافي (كغ)': 43784.59,
          'الاستخدام': 'WARP DEN'
        },
        {
          'نمرة الخيط واسمه': 'Ne 8.8 Carded Even',
          'اللوط': 'S2EZ1A',
          'المصدر': 'EG',
          'الطول في الكونة': 46000,
          'إجمالي عدد الكونات': 1910,
          'إجمالي الوزن الصافي (كغ)': 5946.00,
          'الاستخدام': 'WARP GR +DEN'
        }
      ];
    } else {
      filename = 'نموذج_جدول_المشتريات.xlsx';
      templateData = [
        {
          'رقم الطلبية': 'PO-2026-001',
          'نمرة الخيط': 'Ne 7.4 Open End',
          'المصدر': 'TR',
          'طول الكونة': 44000,
          'الوزن الكلي المطلوب': 45000,
          'تم استلام KG': 43784.59,
          'عدد الببنات المستلمة': 12264,
          'تاريخ الجاهزية المتوقع': '2026-10-07'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'النموذج');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 overflow-hidden flex flex-col max-h-[90vh] transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                استيراد البيانات من ملف Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديث أرقام المستودع أو المشتريات تلقائياً من جداول إكسل
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5 overflow-y-auto flex-1">
          
          {/* Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              اختر الجدول المطلوب تحديثه:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setTargetType('stock'); setParsedRows([]); setFileName(''); }}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                  targetType === 'stock'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-sm">جرد المستودع والحسابات</div>
                  <div className="text-[11px] font-normal opacity-80">رصيد أكياس وكونات الخيط الفعلي</div>
                </div>
                {targetType === 'stock' && <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>

              <button
                type="button"
                onClick={() => { setTargetType('purchases'); setParsedRows([]); setFileName(''); }}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                  targetType === 'purchases'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-sm">جدول طلبات المشتريات</div>
                  <div className="text-[11px] font-normal opacity-80">متابعة شحنات وتوريدات المصانع</div>
                </div>
                {targetType === 'purchases' && <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Import Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              طريقة التحديث:
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                دمج وتحديث البيانات الحالية (الموصى به)
              </label>

              <label className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                استبدال كافة البيانات القديمة بالملف المرفوع
              </label>
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              id="excel-file-input" 
              className="hidden" 
            />
            <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                اضغط هنا لاختيار ملف Excel أو اسحبه إلى هنا
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                يدعم صيغ (.xlsx, .xls, .csv)
              </span>
            </label>

            {fileName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{fileName}</span>
              </div>
            )}
          </div>

          {/* Sample Download Template */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>هل تحب الاستعراض على هيكلية العمود المطلوبة؟</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              تنزيل نموذج إكسل جاهز
            </button>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>معاينة البيانات المستخرجة ({parsedRows.length} صفوف):</span>
                <span className="text-emerald-600 dark:text-emerald-400">جاهز للاستيراد</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">#</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">نمرة الخيط</th>
                      {targetType === 'stock' && <th className="p-2 border-b border-slate-200 dark:border-slate-700">اللوط</th>}
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">المصدر</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">الوزن (كغ)</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">الكونات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {parsedRows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                        <td className="p-2 font-semibold">{r.yarnCount}</td>
                        {targetType === 'stock' && <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">{r.lotNumber}</td>}
                        <td className="p-2">{r.origin}</td>
                        <td className="p-2 font-bold">{Number(r.netWeightKg || r.receivedWeightKg || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} كجم</td>
                        <td className="p-2">{Number(r.netCones || r.receivedConesCount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 8 && (
                  <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                    + وهناك {parsedRows.length - 8} صفوف إضافية في الجدول...
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const pwd = window.prompt('إجراء حساس: يرجى إدخال كلمة المرور لتأكيد تصفير ومسح كافة بيانات النظام (كلمة المرور: 123789):');
              if (pwd === null) return;
              if (pwd.trim() === '123789') {
                if (window.confirm('تأكيد نهائي: هل أنت متأكد من تصفير ومسح جميع البيانات في النظام بالكامل؟')) {
                  storageService.wipeAllDataClean();
                  window.location.reload();
                }
              } else {
                alert('كلمة المرور غير صحيحة! تم إلغاء عملية تصفير النظام.');
              }
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5"
            title="مسح وتصفير المخزون والمشتريات والمسحوبات للبدء من جديد (يتطلب كلمة المرور)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تصفير النظام (0)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  تأكيد استيراد البيانات ({parsedRows.length} صف)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
