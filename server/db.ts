import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Hall,
  LoomGroup,
  Loom,
  FabricItem,
  ProductionOrder,
  LoomAssignment,
  ProductionEntry,
  LoomStoppage,
  AuditLog,
  SystemSettings
} from '../src/types.js';

export interface DatabaseData {
  users: User[];
  userPasswords: Record<string, string>; // userId -> hashedPassword
  halls: Hall[];
  loomGroups: LoomGroup[];
  looms: Loom[];
  fabricItems: FabricItem[];
  productionOrders: ProductionOrder[];
  loomAssignments: LoomAssignment[];
  productionEntries: ProductionEntry[];
  loomStoppages: LoomStoppage[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'weaving_erp.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: DatabaseData | null = null;

export function loadDatabase(): DatabaseData {
  if (dbInstance) return dbInstance;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(raw);
      return dbInstance!;
    } catch (err) {
      console.error('Error reading database file, initializing default seed:', err);
    }
  }

  // If DB file does not exist, initialize seed
  dbInstance = createInitialSeedData();
  saveDatabase(dbInstance);
  return dbInstance;
}

export function saveDatabase(data?: DatabaseData): void {
  const toSave = data || dbInstance;
  if (!toSave) return;
  dbInstance = toSave;

  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(toSave, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

function createInitialSeedData(): DatabaseData {
  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('123789', salt);

  const users: User[] = [
    {
      id: 'u-1',
      username: 'admin',
      fullName: 'أحمد محمود (المدير العام)',
      role: 'manager',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-2',
      username: 'coordinator',
      fullName: 'خالد مصطفى (منسق الإنتاج)',
      role: 'coordinator',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-3',
      username: 'hall_manager',
      fullName: 'سامر حسن (مدير الصالة 1)',
      role: 'hall_manager',
      hallId: 'hall-1',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const userPasswords: Record<string, string> = {
    'u-1': defaultHash,
    'u-2': defaultHash,
    'u-3': defaultHash,
  };

  const halls: Hall[] = [
    {
      id: 'hall-1',
      number: '1',
      name: 'صالة النسيج الرئيسية 1',
      description: 'صالة الأنوال السريعة عالية الدقة للنسيج الثقيل والمتوسط',
      totalLoomsCount: 5,
      status: 'active',
      notes: 'تعمل بـ 3 ورديات يومياً',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hall-2',
      number: '2',
      name: 'صالة النسيج 2 (التوسع الجديد)',
      description: 'صالة أنوال الجاكارد والأقمشة الجاهزة',
      totalLoomsCount: 0,
      status: 'active',
      notes: 'جاهزة لإضافة أنوال جديدة',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomGroups: LoomGroup[] = [
    {
      id: 'grp-1',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      name: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      description: 'أنوال دورنييه وسولزر عالية السرعة',
      loomCount: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'grp-2',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      name: 'المجموعة B (أنوال السادة والأقمشة الخفيفة)',
      description: 'أنوال تويوتا الهوائية',
      loomCount: 2,
      createdAt: new Date().toISOString(),
    },
  ];

  const looms: Loom[] = [
    {
      id: 'loom-1',
      loomNumber: '1',
      code: 'NOL-01',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      manufacturer: 'Dornier',
      model: 'P1 Rapier 2022',
      year: 2022,
      rpm: 520,
      picksPerCm: 20, // 2000 picks/m => 312 m/day theoretically at 24h
      reedWidth: 220,
      fabricWidth: 190,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: 88,
      status: 'running',
      notes: 'حالة ممتازة',
      currentOrderNumber: 'PO-2026-001',
      currentFabricName: 'Gabardine 01 - قماش جابردين فاخر',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'loom-2',
      loomNumber: '2',
      code: 'NOL-02',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      manufacturer: 'Sulzer',
      model: 'G6300 Rapier',
      year: 2021,
      rpm: 490,
      picksPerCm: 20,
      reedWidth: 210,
      fabricWidth: 185,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: 85,
      status: 'running',
      notes: 'يعمل بكفاءة عالية',
      currentOrderNumber: 'PO-2026-001',
      currentFabricName: 'Gabardine 01 - قماش جابردين فاخر',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'loom-3',
      loomNumber: '3',
      code: 'NOL-03',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      manufacturer: 'Toyota',
      model: 'JAT810 Airjet',
      year: 2023,
      rpm: 600,
      picksPerCm: 22,
      reedWidth: 190,
      fabricWidth: 170,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: 90,
      status: 'running',
      notes: 'نول نسيج هوائي سريع جداً',
      currentOrderNumber: 'PO-2026-001',
      currentFabricName: 'Gabardine 01 - قماش جابردين فاخر',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'loom-4',
      loomNumber: '4',
      code: 'NOL-04',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-2',
      groupName: 'المجموعة B (أنوال السادة والأقمشة الخفيفة)',
      manufacturer: 'Picanol',
      model: 'OmniPlus Summum',
      year: 2020,
      rpm: 480,
      picksPerCm: 18,
      reedWidth: 200,
      fabricWidth: 180,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: 82,
      status: 'stopped',
      notes: 'متوقف لانتظار تغطية السداء',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'loom-5',
      loomNumber: '5',
      code: 'NOL-05',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-2',
      groupName: 'المجموعة B (أنوال السادة والأقمشة الخفيفة)',
      manufacturer: 'Tsudakoma',
      model: 'ZAX9200i',
      year: 2019,
      rpm: 500,
      picksPerCm: 20,
      reedWidth: 190,
      fabricWidth: 175,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: 85,
      status: 'maintenance',
      notes: 'تحت الصيانة الميكانيكية الدورية',
      createdAt: new Date().toISOString(),
    },
  ];

  const fabricItems: FabricItem[] = [
    {
      id: 'fab-1',
      code: 'FAB-GAB-01',
      name: 'Gabardine 01 - قماش جابردين فاخر',
      description: 'نسيج جابردين قطني 100% عالي المتانة للبدلات والزي الرسمي',
      warpYarnCount: 'Ne 30/2',
      weftYarnCount: 'Ne 20/1',
      yarnType: 'قطن ممشوق 100%',
      weaveStructure: 'مبرد 2/2 Twill',
      reedWidth: 220,
      fabricWidth: 190,
      warpDensity: 32,
      weftDensity: 20,
      requiredRpm: 500,
      requiredProductionMeters: 50000,
      startDate: '2026-08-01',
      targetDeliveryDate: '2026-09-15',
      notes: 'مواصفات الجودة عالية جداً',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fab-2',
      code: 'FAB-POP-02',
      name: 'Poplin 02 - قماش بوبلين ملون',
      description: 'قماش بوبلين خفيف للقمصان الصيفية',
      warpYarnCount: 'Ne 40/1',
      weftYarnCount: 'Ne 40/1',
      yarnType: 'قطن / بوليستر 65/35',
      weaveStructure: 'سادة 1/1 Plain',
      reedWidth: 190,
      fabricWidth: 170,
      warpDensity: 40,
      weftDensity: 24,
      requiredRpm: 550,
      requiredProductionMeters: 30000,
      startDate: '2026-08-10',
      targetDeliveryDate: '2026-09-30',
      notes: 'جاهز لبدء أوردر جديد',
      createdAt: new Date().toISOString(),
    },
  ];

  const productionOrders: ProductionOrder[] = [
    {
      id: 'po-1',
      orderNumber: 'PO-2026-001',
      fabricItemId: 'fab-1',
      fabricItemCode: 'FAB-GAB-01',
      fabricItemName: 'Gabardine 01 - قماش جابردين فاخر',
      requiredQuantityMeters: 50000,
      producedQuantityMeters: 14500,
      startDate: '2026-08-01',
      targetDeliveryDate: '2026-09-15',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      assignedLoomIds: ['loom-1', 'loom-2', 'loom-3'],
      status: 'in_progress',
      notes: 'طلب توريد لصالح شركة المنسوجات الوطنية',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomAssignments: LoomAssignment[] = [
    {
      id: 'la-1',
      productionOrderId: 'po-1',
      loomId: 'loom-1',
      loomNumber: '1',
      dailyExpectedMeters: 275,
      producedMeters: 5200,
      remainingMeters: 11466,
      expectedDays: 42,
      status: 'active',
    },
    {
      id: 'la-2',
      productionOrderId: 'po-1',
      loomId: 'loom-2',
      loomNumber: '2',
      dailyExpectedMeters: 250,
      producedMeters: 4800,
      remainingMeters: 11866,
      expectedDays: 47,
      status: 'active',
    },
    {
      id: 'la-3',
      productionOrderId: 'po-1',
      loomId: 'loom-3',
      loomNumber: '3',
      dailyExpectedMeters: 265,
      producedMeters: 4500,
      remainingMeters: 12166,
      expectedDays: 46,
      status: 'active',
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const productionEntries: ProductionEntry[] = [
    {
      id: 'pe-1',
      date: todayStr,
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      loomId: 'loom-1',
      loomNumber: '1',
      fabricItemId: 'fab-1',
      fabricItemName: 'Gabardine 01 - قماش جابردين فاخر',
      productionOrderId: 'po-1',
      orderNumber: 'PO-2026-001',
      shift: 'shift_1',
      operatingHours: 7.5,
      downtimeHours: 0.5,
      actualMeters: 92,
      theoreticalMeters: 97.5,
      efficiencyPercent: 94.4,
      notes: 'إنتاج ممتاز في الوردية الأولى',
      createdBy: 'سامر حسن',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pe-2',
      date: todayStr,
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الجاكارد والنسيج المركب)',
      loomId: 'loom-2',
      loomNumber: '2',
      fabricItemId: 'fab-1',
      fabricItemName: 'Gabardine 01 - قماش جابردين فاخر',
      productionOrderId: 'po-1',
      orderNumber: 'PO-2026-001',
      shift: 'shift_1',
      operatingHours: 7.0,
      downtimeHours: 1.0,
      actualMeters: 80,
      theoreticalMeters: 91.8,
      efficiencyPercent: 87.1,
      notes: 'توقف بسيط للشدة',
      createdBy: 'سامر حسن',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomStoppages: LoomStoppage[] = [
    {
      id: 'stp-1',
      loomId: 'loom-5',
      loomNumber: '5',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الرئيسية 1',
      date: todayStr,
      startTime: '08:00',
      endTime: '11:30',
      durationMinutes: 210,
      reason: 'mechanical',
      notes: 'استبدال السير الرئيسي وضبط المشط',
      createdBy: 'سامر حسن',
      createdAt: new Date().toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      userId: 'u-1',
      username: 'admin',
      role: 'manager',
      action: 'login',
      targetEntity: 'نظام ERP قسم النسيج',
      newValue: 'تسجيل دخول ناجح للمدير',
      timestamp: new Date().toISOString(),
    },
  ];

  const settings: SystemSettings = {
    factoryName: 'معمل النسيج الوطني الحديث',
    departmentName: 'قسم النسيج والأنوال الإلكترونية',
    shifts: [
      { id: 'shift_1', name: 'الوردية الأولى (الصباحية)', startTime: '07:00', endTime: '15:00' },
      { id: 'shift_2', name: 'الوردية الثانية (المسائية)', startTime: '15:00', endTime: '23:00' },
      { id: 'shift_3', name: 'الوردية الثالثة (الليلية)', startTime: '23:00', endTime: '07:00' },
    ],
    defaultWorkingHours: 24,
    targetEfficiencyPercent: 85,
    alertLowEfficiencyThreshold: 75,
    alertLongDowntimeMinutes: 120,
    isDemoData: true,
  };

  return {
    users,
    userPasswords,
    halls,
    loomGroups,
    looms,
    fabricItems,
    productionOrders,
    loomAssignments,
    productionEntries,
    loomStoppages,
    auditLogs,
    settings,
  };
}

export function logAudit(
  userId: string,
  username: string,
  role: any,
  action: 'create' | 'update' | 'delete' | 'login' | 'reset',
  targetEntity: string,
  previousValue?: string,
  newValue?: string
) {
  const db = loadDatabase();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    username,
    role,
    action,
    targetEntity,
    previousValue,
    newValue,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  // Keep last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDatabase(db);
}
