// ==========================================
// UNIFIED TEXTILE ERP - GLOBAL TYPE DEFINITIONS
// Covers both Weaving Production and Yarn Warehouse Modules
// ==========================================

// --- App Module Identifiers ---
export type AppModule = 'gateway' | 'production' | 'yarn-warehouse';

// ==========================================
// 1. WEAVING PRODUCTION SYSTEM TYPES
// ==========================================

export type UserRole = 'manager' | 'coordinator' | 'hall_manager' | 'operator' | 'admin' | 'production' | 'warehouse_manager';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  hallId?: string;
  assignedHallId?: string;
  active: boolean;
  createdAt: string;
}

export interface Hall {
  id: string;
  number: string;
  name: string;
  description?: string;
  totalLoomsCount: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface LoomGroup {
  id: string;
  hallId: string;
  hallName?: string;
  name: string;
  description?: string;
  loomCount: number;
  createdAt: string;
}

export type LoomStatus = 'running' | 'stopped' | 'maintenance' | 'unavailable';

export interface Loom {
  id: string;
  loomNumber: string;
  code?: string;
  hallId: string;
  hallName?: string;
  groupId?: string;
  groupName?: string;
  manufacturer?: string;
  model?: string;
  year?: number | string;
  reedWidth?: number;
  reedWidthCm?: number;
  fabricWidth?: number;
  dailyOperatingHours?: number;
  shiftsCount?: number;
  standardRpm?: number;
  rpm: number;
  picksPerCm?: number;
  currentFabricCode?: string;
  currentFabricName?: string;
  currentOrderNumber?: string;
  fabricId?: string;
  status: LoomStatus;
  defaultEfficiencyPercent?: number;
  efficiency?: number;
  totalPicks?: number;
  metersProduced?: number;
  notes?: string;
  createdAt: string;
}

export interface FabricItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  description?: string;
  warpYarn?: string;
  weftYarn?: string;
  warpYarnCount?: string;
  weftYarnCount?: string;
  yarnType?: string;
  weaveStructure?: string;
  reedWidth?: number;
  reedWidthCm?: number;
  fabricWidth?: number;
  reedNumber?: number;
  endsPerDent?: number;
  warpDensity?: number;
  totalWarpEnds?: number;
  weftDensity?: number;
  picksPerCm?: number;
  endsPerCm?: number;
  requiredRpm?: number;
  standardRpm?: number;
  efficiencyTarget?: number;
  notes?: string;
  createdAt: string;
}

export type ProductionOrderStatus = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  fabricItemId: string;
  fabricItemCode?: string;
  fabricItemName?: string;
  targetQuantityMeters?: number;
  requiredQuantityMeters?: number;
  producedQuantityMeters: number;
  remainingQuantityMeters?: number;
  startDate?: string;
  targetEndDate?: string;
  targetDeliveryDate?: string;
  hallId?: string;
  hallName?: string;
  groupId?: string;
  groupName?: string;
  assignedLoomIds?: string[];
  assignedLoomsCount?: number;
  status: ProductionOrderStatus;
  notes?: string;
  createdAt: string;
}

export interface LoomAssignment {
  id: string;
  loomId: string;
  loomNumber: string;
  productionOrderId: string;
  orderNumber?: string;
  assignedDate?: string;
  dailyExpectedMeters?: number;
  producedMeters?: number;
  remainingMeters?: number;
  expectedDays?: number;
  status?: string;
  active?: boolean;
}

export type ShiftType = 'morning' | 'evening' | 'night' | 'shift1' | 'shift2' | 'shift3' | 'shift_1' | 'shift_2' | 'shift_3';

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ProductionEntry {
  id: string;
  date: string;
  shift: ShiftType;
  shiftName?: string;
  hallId: string;
  hallName?: string;
  groupId?: string;
  groupName?: string;
  loomId: string;
  loomNumber: string;
  productionOrderId?: string;
  orderNumber?: string;
  fabricItemId?: string;
  fabricItemName?: string;
  rpm?: number;
  workingHours?: number;
  operatingHours?: number;
  downtimeHours?: number;
  theoreticalMeters: number;
  actualMeters: number;
  efficiencyPercentage?: number;
  efficiencyPercent?: number;
  operatorName?: string;
  createdBy?: string;
  notes?: string;
  createdAt: string;
}

export type DowntimeReason =
  | 'warp_break'
  | 'weft_break'
  | 'mechanical_fault'
  | 'electrical_fault'
  | 'beam_change'
  | 'article_change'
  | 'style_change'
  | 'maintenance'
  | 'cleaning'
  | 'power_cut'
  | 'lack_of_yarn'
  | 'yarn_shortage'
  | 'no_operator'
  | 'operator_absent'
  | 'planned_stop'
  | 'mechanical'
  | 'electrical'
  | 'other';

export interface LoomStoppage {
  id: string;
  date: string;
  shift?: ShiftType;
  startTime?: string;
  endTime?: string;
  hallId?: string;
  hallName?: string;
  loomId: string;
  loomNumber?: string;
  reason: DowntimeReason;
  reasonAr?: string;
  durationMinutes: number;
  notes?: string;
  technicianName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  username?: string;
  userRole?: string;
  role?: string;
  action: string;
  resource?: string;
  targetEntity?: string;
  targetId?: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface SystemSettings {
  factoryName: string;
  departmentName: string;
  currency?: string;
  shiftsCount?: number;
  shift1Name?: string;
  shift2Name?: string;
  shift3Name?: string;
  shifts?: ShiftConfig[];
  defaultWorkingHours?: number;
  targetEfficiencyPercent?: number;
  alertLowEfficiencyThreshold?: number;
  alertLongDowntimeMinutes?: number;
  autoCalculateEfficiency?: boolean;
  isDemoData: boolean;
}

export type ProductionNavTab =
  | 'dashboard'
  | 'halls'
  | 'groups'
  | 'looms'
  | 'fabrics'
  | 'orders'
  | 'entry'
  | 'stoppages'
  | 'monitoring'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

export type NavTab = ProductionNavTab;


// ==========================================
// 2. YARN WAREHOUSE SYSTEM TYPES
// ==========================================

export type WarehouseUserRole = 'admin' | 'production' | 'warehouse_manager';

export interface UserAccountInfo {
  role: WarehouseUserRole;
  name: string;
  title: string;
  password: string;
  description: string;
  badgeColor: string;
}

export const USER_ACCOUNTS: Record<WarehouseUserRole, UserAccountInfo> = {
  admin: {
    role: 'admin',
    name: 'مدير النظام',
    title: 'مدير النظام (Admin)',
    password: '123789',
    description: 'تحكم وصلاحيات كاملة وشاملة لكافة الأقسام والإعدادات والسجلات وتعديل وحذف البيانات',
    badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800'
  },
  production: {
    role: 'production',
    name: 'مسؤول الإنتاج',
    title: 'مسؤول الإنتاج',
    password: '123789',
    description: 'إدارة طلبات الشراء، جدولة توريد الغزول، تسجيل السحوبات، واستهلاك صالات النسيج والتوصيات',
    badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
  },
  warehouse_manager: {
    role: 'warehouse_manager',
    name: 'أمين المستودع',
    title: 'أمين المستودع',
    password: '112233',
    description: 'متابعة رصيد المستودع الحقيقي، معالجة استلام الشحنات الواردة، وإذونات السحب',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
  }
};

export type OriginCode = 'TR' | 'EG' | 'SYR' | 'IN' | 'CN' | string;

export type OrderStatus = 'draft' | 'approved' | 'manufacturing' | 'shipped' | 'partially_received' | 'completed' | 'cancelled';

export type UsageType = 'WARP DEN' | 'WEFT DEN' | 'WEFT GR' | 'WARP GR +DEN' | 'WARP GR' | 'SPECIAL' | string;

export interface PurchaseOrderItem {
  id: string;
  yarnCount: string;            // نمرة الخيط e.g. "Ne 7.4 Open End"
  origin: OriginCode;           // المصدر e.g. "TR", "EG"
  coneLength: number;           // طول الكونة e.g. 44000
  lotNumber?: string;           // رقم اللوط
  warpConesCount?: number;      // عدد البوبينات للسداء
  weftWeight?: number;          // وزن الحدف KG
  totalRequiredWeightKg: number;// الوزن الكلي المطلوب KG
  receivedWeightKg: number;     // تم استلام KG
  pendingWeightKg: number;      // تحت الطلب KG (تلقائي)
  receivedConesCount: number;   // عدد البوبينات المستلمة
  expectedReadinessDate: string;// تاريخ الجاهزية المتوقع (e.g. "7/10/2026" or "جرد")
  isInventoryCheck?: boolean;   // هل الحالة "جرد"
  unitPrice?: number;           // سعر الكيلو
  notes?: string;
  status: OrderStatus;
  poNumber?: string;            // رقم طلب الشراء
  createdAt: string;
}

export interface WarehouseStockItem {
  id: string;
  yarnCount: string;            // نمرة الخيط
  origin: OriginCode;           // المصدر
  coneLength: number;           // طول الكونة
  lotNumber?: string;           // رقم اللوط (Lot No.)
  totalReceivedKg: number;      // إجمالي المستلم KG
  totalReceivedCones: number;   // إجمالي الكونات المستلمة
  totalWithdrawnKg: number;      // إجمالي المسحوب KG
  totalWithdrawnCones: number;  // إجمالي الكونات المسحوبة
  netWeightKg: number;          // إجمالي الوزن (مستلم - مسحوب)
  netCones: number;             // إجمالي الكونات (مستلم - مسحوب)
  usage: UsageType;             // الاستخدام
  notes?: string;
  minStockKg: number;           // الحد الأدنى للمخزون
  maxStockKg: number;           // الحد الأقصى للمخزون
  warehouseName?: string;       // اسم المستودع الرئيسي
}

export interface Withdrawal {
  id: string;
  withdrawalNumber: string;     // رقم إذن السحب
  date: string;                 // تاريخ التوجيه
  yarnCount: string;            // نمرة الخيط
  origin: OriginCode;           // المصدر
  coneLength: number;           // طول الكونة
  lotNumber?: string;           // رقم اللوط
  withdrawnKg: number;          // إجمالي الوزن المسحوب KG
  withdrawnCones: number;       // إجمالي الكونات المسحوبة
  department: string;           // الاستخدام / القسم (e.g. خشارفة, قسم النسيج)
  productionOrder?: string;     // أمر الإنتاج
  fabricName?: string;          // اسم القماش
  operatorName?: string;        // اسم المشغل / المستلم
  notes?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  timestamp: string;
  type: 'RECEIPT' | 'WITHDRAWAL' | 'TRANSFER' | 'ADJUSTMENT';
  typeAr: string;
  referenceNo: string;          // رقم المرجع (رقم PO أو إذن السحب)
  yarnCount: string;
  origin: OriginCode;
  coneLength: number;
  weightChangeKg: number;       // موجب للإضافة، سالب للسحب
  conesChange: number;
  runningBalanceKg: number;     // الرصيد الجاري بعد الحركة
  runningBalanceCones: number;
  departmentOrSupplier?: string;
  notes?: string;
  operator?: string;
}

export interface PurchaseRecommendation {
  yarnCount: string;
  origin: OriginCode;
  coneLength: number;
  currentStockKg: number;
  pendingPoKg: number;
  avgMonthlyConsumptionKg: number;
  minStockThresholdKg: number;
  suggestedOrderKg: number;
  suggestedOrderDate: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'danger' | 'success' | 'alert';
  date?: string;
  createdAt?: string;
  read?: boolean;
  isRead?: boolean;
}

export type WarehouseActiveTab =
  | 'dashboard'
  | 'purchases'
  | 'warehouse'
  | 'withdrawals'
  | 'movements'
  | 'recommendations'
  | 'audit'
  | 'backup';
