import * as XLSX from 'xlsx';
import { PurchaseOrderItem, WarehouseStockItem, Withdrawal, InventoryMovement } from '../types';
import { calculatePOTolerance, parseExcelDate } from './poUtils';

/**
 * Export Purchase Orders to Excel file matching the original PDF/Excel column format exactly
 */
export function exportPurchasesToExcel(data: PurchaseOrderItem[]) {
  const formattedData = data.map((item, index) => {
    const tol = calculatePOTolerance(item.totalRequiredWeightKg, item.receivedWeightKg);
    let statusText = '';
    if (tol.isCompleted) {
      if (tol.isCompletedWithinTolerance) {
        statusText = 'مكتمل (ضمن سماحية 5%)';
      } else if (tol.isExcess) {
        statusText = `مكتمل (بزيادة +${tol.excessPercent}%)`;
      } else {
        statusText = 'مكتمل بالكامل';
      }
    } else {
      statusText = item.receivedWeightKg > 0 ? 'غير مكتمل (مستلم جزئياً)' : 'غير مكتمل (لم يستلم بعد)';
    }

    return {
      'م': index + 1,
      'نمرة الخيط': item.yarnCount,
      'عدد البوبينات للسداء': item.warpConesCount || '',
      'طول الكونة': item.coneLength,
      'وزن الحدف': item.weftWeight || '',
      'الوزن الكلي المطلوب KG': item.totalRequiredWeightKg,
      'المصدر': item.origin,
      'تم استلام KG': item.receivedWeightKg,
      'تحت الطلب KG': tol.pendingWeightKg,
      'عدد البوبينات المستلمة': item.receivedConesCount,
      'تاريخ الجاهزية المتوقع': parseExcelDate(item.expectedReadinessDate),
      'الحالة / الملاحظات': statusText
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المشتريات');

  XLSX.writeFile(workbook, `تقرير_المشتريات_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Warehouse Stock to Excel matching PDF Page 5 & 6 format
 */
export function exportWarehouseToExcel(data: WarehouseStockItem[]) {
  const formattedData = data.map((item, index) => ({
    'م': index + 1,
    'نمرة الخيط': item.yarnCount,
    'المصدر': item.origin,
    'طول الكونة': item.coneLength,
    'رقم اللوط': item.lotNumber || 'LOT-MAIN',
    'إجمالي الوزن (الرصيد) KG': item.netWeightKg,
    'إجمالي الكونات الحالية': item.netCones,
    'الملاحظات': item.notes || '',
    'الاستخدام': item.usage
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المستودع');

  XLSX.writeFile(workbook, `تقرير_رصيد_المستودع_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Withdrawals to Excel matching PDF Page 3 & 4 format
 */
export function exportWithdrawalsToExcel(data: Withdrawal[]) {
  const formattedData = data.map((item, index) => ({
    'م': index + 1,
    'رقم الإذن': item.withdrawalNumber,
    'تاريخ التوجيه': item.date,
    'نمرة الخيط': item.yarnCount,
    'المصدر': item.origin,
    'طول الكونة': item.coneLength,
    'إجمالي الوزن KG': item.withdrawnKg,
    'إجمالي الكونات': item.withdrawnCones,
    'الاستخدام / القسم': item.department,
    'أمر الإنتاج': item.productionOrder || '-',
    'اسم القماش': item.fabricName || '-',
    'المشغل': item.operatorName || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'السحوبات');

  XLSX.writeFile(workbook, `تقرير_سحوبات_المستودع_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportMovementsToExcel(data: InventoryMovement[]) {
  const formattedData = data.map((item, index) => ({
    'م': index + 1,
    'التاريخ': new Date(item.timestamp).toLocaleString('ar-EG'),
    'نوع الحركة': item.typeAr,
    'رقم المرجع': item.referenceNo,
    'نمرة الخيط': item.yarnCount,
    'المصدر': item.origin,
    'طول الكونة': item.coneLength,
    'الوزن المتأثر (كجم)': item.weightChangeKg,
    'عدد الكونات المتأثر': item.conesChange,
    'الرصيد المتبقي (كجم)': item.runningBalanceKg,
    'القسم / المورد': item.departmentOrSupplier || '-',
    'ملاحظات': item.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'حركات المخزون');

  XLSX.writeFile(workbook, `كشف_حركات_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Trigger native print with professional print CSS layout
 */
export function printElement(title: string) {
  const originalTitle = document.title;
  document.title = title;
  window.print();
  document.title = originalTitle;
}

function translateStatus(status: string): string {
  switch (status) {
    case 'draft': return 'مسودة';
    case 'approved': return 'معتمد';
    case 'manufacturing': return 'قيد التصنيع';
    case 'shipped': return 'تم الشحن';
    case 'partially_received': return 'مستلم جزئياً';
    case 'completed': return 'مكتمل';
    case 'cancelled': return 'ملغى';
    default: return status;
  }
}
