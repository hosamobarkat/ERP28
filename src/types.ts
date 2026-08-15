/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'manager' | 'coordinator' | 'hall_manager';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  hallId?: string; // Optional restriction for hall managers
  assignedHallId?: string;
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export type LoomStatus = 'running' | 'stopped' | 'maintenance' | 'unavailable';

export interface Hall {
  id: string;
  number: string;
  name: string;
  description: string;
  totalLoomsCount: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
}

export interface LoomGroup {
  id: string;
  hallId: string;
  hallName?: string;
  name: string;
  description: string;
  loomCount?: number;
  createdAt?: string;
}

export interface Loom {
  id: string;
  loomNumber: string;
  code: string;
  hallId: string;
  hallName?: string;
  groupId: string;
  groupName?: string;
  manufacturer: string;
  model: string;
  year?: number;
  rpm: number; // Speed in RPM
  picksPerCm: number; // Density in Picks/cm
  reedWidth: number; // cm
  fabricWidth: number; // cm
  dailyOperatingHours: number; // Default 24 hours
  shiftsCount: number; // Default 3
  defaultEfficiencyPercent: number; // Default e.g. 85%
  status: LoomStatus;
  notes?: string;
  currentOrderNumber?: string;
  currentFabricName?: string;
  createdAt?: string;
}

export interface FabricItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  warpYarnCount: string; // نمرة خيط السداء
  weftYarnCount: string; // نمرة خيط اللحمة
  yarnType: string; // نوع الخيط
  weaveStructure: string; // التركيب النسيجي
  reedWidth: number; // عرض المشط cm
  fabricWidth: number; // عرض القماش cm
  warpDensity: number; // كثافة السداء
  weftDensity: number; // كثافة اللحمة (Picks/cm)
  requiredRpm: number; // سرعة النول المطلوبة
  requiredProductionMeters: number; // الإنتاج المطلوب بالمتر
  startDate?: string;
  targetDeliveryDate?: string;
  notes?: string;
  createdAt?: string;
}

export type OrderStatus = 'planned' | 'in_progress' | 'stopped' | 'completed' | 'delayed' | 'cancelled';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  fabricItemId: string;
  fabricItemCode?: string;
  fabricItemName?: string;
  requiredQuantityMeters: number;
  producedQuantityMeters: number;
  startDate: string;
  targetDeliveryDate: string;
  hallId: string;
  hallName?: string;
  groupId?: string;
  groupName?: string;
  assignedLoomIds: string[];
  status: OrderStatus;
  notes?: string;
  createdAt?: string;
}

export interface LoomAssignment {
  id: string;
  productionOrderId: string;
  loomId: string;
  loomNumber: string;
  dailyExpectedMeters: number;
  producedMeters: number;
  remainingMeters: number;
  expectedDays: number;
  status: 'active' | 'completed' | 'paused';
}

export type ShiftType = 'shift_1' | 'shift_2' | 'shift_3';

export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  hallId: string;
  hallName?: string;
  groupId: string;
  groupName?: string;
  loomId: string;
  loomNumber: string;
  fabricItemId: string;
  fabricItemName?: string;
  productionOrderId: string;
  orderNumber?: string;
  shift: ShiftType;
  operatingHours: number;
  downtimeHours: number;
  actualMeters: number;
  theoreticalMeters: number;
  efficiencyPercent: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type DowntimeReason = 
  | 'mechanical' 
  | 'electrical' 
  | 'warp_break' 
  | 'weft_break' 
  | 'style_change' 
  | 'yarn_shortage' 
  | 'maintenance' 
  | 'operator_absent' 
  | 'planned_stop' 
  | 'other';

export interface LoomStoppage {
  id: string;
  loomId: string;
  loomNumber: string;
  hallId: string;
  hallName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  reason: DowntimeReason;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  action: 'create' | 'update' | 'delete' | 'login' | 'reset';
  targetEntity: string; // e.g. "نول 1", "أمر إنتاج PO-101"
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface ShiftConfig {
  id: ShiftType;
  name: string;
  startTime: string;
  endTime: string;
}

export interface SystemSettings {
  factoryName: string;
  departmentName: string;
  shifts: ShiftConfig[];
  defaultWorkingHours: number;
  targetEfficiencyPercent: number;
  alertLowEfficiencyThreshold: number;
  alertLongDowntimeMinutes: number;
  isDemoData: boolean;
}

export interface SummaryStats {
  totalLooms: number;
  runningLooms: number;
  stoppedLooms: number;
  maintenanceLooms: number;
  unavailableLooms: number;
  todayProductionMeters: number;
  weekProductionMeters: number;
  monthProductionMeters: number;
  targetProductionMeters: number;
  targetAchievementPercent: number;
  averageEfficiencyPercent: number;
  activeOrdersCount: number;
  delayedOrdersCount: number;
  nearCompletionOrdersCount: number;
  totalDowntimeHoursToday: number;
}
