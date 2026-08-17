import { OrderStatus, PurchaseOrderItem } from '../types';

export interface POToleranceInfo {
  reqKg: number;
  rcvdKg: number;
  pendingWeightKg: number;
  status: OrderStatus;
  isCompleted: boolean;                  // Received >= 95% of required
  isCompletedWithinTolerance: boolean;    // Received >= 95% and < 100%
  isExactOrNormalCompletion: boolean;     // Received >= 100% and <= 105%
  isExcess: boolean;                      // Received > 105% (exceeds +5% tolerance)
  excessKg: number;
  excessPercent: number;                  // e.g. 8.5 (%)
  receivedPercent: number;                // e.g. 96.5 (%)
}

/**
 * Calculates purchase order status considering ±5% tolerance rule.
 * - Minimum completion threshold: 95% of totalRequiredWeightKg
 * - Maximum standard threshold: 105% of totalRequiredWeightKg
 * - Received >= 95%: Order is COMPLETED, pendingWeightKg becomes 0.
 * - Received > 105%: Order is COMPLETED, but flagged with warning alert (>5% excess).
 */
export function calculatePOTolerance(totalRequiredWeightKg: number, receivedWeightKg: number): POToleranceInfo {
  const reqKg = Number(totalRequiredWeightKg) || 0;
  const rcvdKg = Number(receivedWeightKg) || 0;

  if (reqKg <= 0) {
    return {
      reqKg: 0,
      rcvdKg,
      pendingWeightKg: 0,
      status: 'completed',
      isCompleted: true,
      isCompletedWithinTolerance: false,
      isExactOrNormalCompletion: true,
      isExcess: false,
      excessKg: 0,
      excessPercent: 0,
      receivedPercent: 100
    };
  }

  const receivedPercent = Math.round((rcvdKg / reqKg) * 1000) / 10;
  const minCompletedKg = reqKg * 0.95; // 95% threshold
  const maxAllowedKg = reqKg * 1.05;   // 105% threshold

  const isCompleted = rcvdKg >= minCompletedKg;
  const isCompletedWithinTolerance = rcvdKg >= minCompletedKg && rcvdKg < reqKg;
  const isExactOrNormalCompletion = rcvdKg >= reqKg && rcvdKg <= maxAllowedKg;
  const isExcess = rcvdKg > maxAllowedKg;

  const excessKg = isExcess ? Math.round((rcvdKg - maxAllowedKg) * 100) / 100 : 0;
  const excessPercent = isExcess ? Math.round(((rcvdKg - reqKg) / reqKg) * 1000) / 10 : 0;

  let pendingWeightKg = 0;
  let status: OrderStatus = 'completed';

  if (isCompleted) {
    pendingWeightKg = 0;
    status = 'completed';
  } else {
    pendingWeightKg = Math.max(0, Math.round((reqKg - rcvdKg) * 100) / 100);
    status = rcvdKg > 0 ? 'partially_received' : 'approved';
  }

  return {
    reqKg,
    rcvdKg,
    pendingWeightKg,
    status,
    isCompleted,
    isCompletedWithinTolerance,
    isExactOrNormalCompletion,
    isExcess,
    excessKg,
    excessPercent,
    receivedPercent
  };
}

/**
 * Safely parses and formats Excel dates (numbers like 45210, Date objects, or string dates).
 */
export function parseExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return 'جرد';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return 'جرد';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof val === 'number') {
    if (val > 25000 && val < 60000) {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    return String(val);
  }

  const str = String(val).trim();
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (num > 25000 && num < 60000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  return str || 'جرد';
}

/**
 * Parses various date representations into a standard JavaScript Date object.
 * Returns null if the value is not a valid chronological date (e.g. 'جرد' or empty).
 */
export function parsePoDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }

  const str = String(val).trim();
  if (!str || str === 'جرد' || str === 'مخزون' || str === 'غير محدد') {
    return null;
  }

  // Handle Excel Serial Number string or number
  if (/^\d{5}(\.\d+)?$/.test(str) || typeof val === 'number') {
    const num = typeof val === 'number' ? val : parseFloat(str);
    if (num > 25000 && num < 60000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }

  // Format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const part1 = parseInt(dmyMatch[1], 10);
    const part2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    
    // In typical arabic / international contexts: Day/Month/Year
    // If part1 > 12, it must be day
    // If part2 > 12, part2 is day and part1 is month
    let day = part1;
    let month = part2 - 1;
    if (part2 > 12 && part1 <= 12) {
      day = part2;
      month = part1 - 1;
    }

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Native Date fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}

export interface DelayedPOInfo {
  po: PurchaseOrderItem;
  daysDelayed: number;
  expectedDateObj: Date;
  expectedDateFormatted: string;
  pendingWeightKg: number;
  receivedPercent: number;
  urgencyLevel: 'high' | 'medium' | 'low'; // high > 14 days, medium 7-14 days, low < 7 days
}

/**
 * Determines if a purchase order is delayed based on its expected readiness date and completion status.
 */
export function checkDelayedPurchaseOrder(po: PurchaseOrderItem, referenceDate?: Date): DelayedPOInfo | null {
  const tol = calculatePOTolerance(po.totalRequiredWeightKg, po.receivedWeightKg);
  
  // If order is completed or has no pending weight, it is not delayed
  if (tol.isCompleted || tol.pendingWeightKg <= 0) {
    return null;
  }

  // If flagged as inventory check or has no specific date
  if (po.isInventoryCheck || po.expectedReadinessDate === 'جرد') {
    return null;
  }

  const dateObj = parsePoDate(po.expectedReadinessDate);
  if (!dateObj) {
    return null;
  }

  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dateObj.getTime();
  const daysDelayed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysDelayed <= 0) {
    return null; // On time or scheduled in the future
  }

  let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
  if (daysDelayed > 14) {
    urgencyLevel = 'high';
  } else if (daysDelayed >= 7) {
    urgencyLevel = 'medium';
  }

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  const expectedDateFormatted = `${y}/${m}/${d}`;

  return {
    po,
    daysDelayed,
    expectedDateObj: dateObj,
    expectedDateFormatted,
    pendingWeightKg: tol.pendingWeightKg,
    receivedPercent: tol.receivedPercent,
    urgencyLevel
  };
}

