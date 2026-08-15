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
      fullName: 'مدير النظام',
      role: 'manager',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-2',
      username: 'coordinator',
      fullName: 'منسق عام الإنتاج',
      role: 'coordinator',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-3',
      username: 'hall_manager',
      fullName: 'مدير صالة النسيج الخامي',
      role: 'hall_manager',
      hallId: 'hall-1',
      assignedHallId: 'hall-1',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-4',
      username: 'hall_manager_2',
      fullName: 'مدير صالة الجينز',
      role: 'hall_manager',
      hallId: 'hall-2',
      assignedHallId: 'hall-2',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const userPasswords: Record<string, string> = {
    'u-1': defaultHash,
    'u-2': defaultHash,
    'u-3': defaultHash,
    'u-4': defaultHash,
  };

  const halls: Hall[] = [
    {
      id: 'hall-1',
      number: '1',
      name: 'صالة النسيج الخامي',
      description: 'صالة متخصصة لإنتاج أقمشة الغابردين (42 نول بيكانول اوبتي ماكس 2017)',
      totalLoomsCount: 42,
      status: 'active',
      notes: '42 نول Picanol OptiMax-i-4-R 2017 بعرض 220 سم - تعمل بـ 3 ورديات',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hall-2',
      number: '2',
      name: 'صالة الجينز',
      description: 'صالة متخصصة لإنتاج أقمشة الدنيم والجينز (54 نول بيكانول اوبتي ماكس 2017)',
      totalLoomsCount: 54,
      status: 'active',
      notes: '54 نول Picanol OptiMax-i-4-R 2017 بعرض 220 سم - تعمل بـ 3 ورديات',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomGroups: LoomGroup[] = [
    {
      id: 'grp-1',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الخامي',
      name: 'المجموعة A (أنوال الغابردين 1 - 21)',
      description: '21 نول Picanol OptiMax-i-4-R 2017 - 220cm',
      loomCount: 21,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'grp-2',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الخامي',
      name: 'المجموعة B (أنوال الغابردين 22 - 42)',
      description: '21 نول Picanol OptiMax-i-4-R 2017 - 220cm',
      loomCount: 21,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'grp-3',
      hallId: 'hall-2',
      hallName: 'صالة الجينز',
      name: 'المجموعة C (أنوال الدنيم 43 - 70)',
      description: '28 نول Picanol OptiMax-i-4-R 2017 - 220cm',
      loomCount: 28,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'grp-4',
      hallId: 'hall-2',
      hallName: 'صالة الجينز',
      name: 'المجموعة D (أنوال الدنيم 71 - 96)',
      description: '26 نول Picanol OptiMax-i-4-R 2017 - 220cm',
      loomCount: 26,
      createdAt: new Date().toISOString(),
    },
  ];

  // Generate 96 Looms (42 in Hall 1 Gabardine, 54 in Hall 2 Denim) - All Picanol OptiMax-i-4-R 2017
  const looms: Loom[] = [];
  for (let i = 1; i <= 96; i++) {
    const isHall1 = i <= 42;
    const loomNumStr = String(i);
    const code = `PC-${String(i).padStart(2, '0')}`;
    let groupId = 'grp-1';
    let groupName = 'المجموعة A (أنوال الغابردين 1 - 21)';

    if (isHall1) {
      if (i > 21) {
        groupId = 'grp-2';
        groupName = 'المجموعة B (أنوال الغابردين 22 - 42)';
      }
    } else {
      if (i <= 70) {
        groupId = 'grp-3';
        groupName = 'المجموعة C (أنوال الدنيم 43 - 70)';
      } else {
        groupId = 'grp-4';
        groupName = 'المجموعة D (أنوال الدنيم 71 - 96)';
      }
    }

    let status: 'running' | 'stopped' | 'maintenance' = 'running';
    let notes = 'حالة تشغيل ممتازة';

    if (i === 12) {
      status = 'stopped';
      notes = 'توقف لتبديل مطواة السداء';
    } else if (i === 35) {
      status = 'maintenance';
      notes = 'صيانة وقائية دورية ومراجعة اللحمة';
    } else if (i === 62) {
      status = 'stopped';
      notes = 'توقف لعقد خيوط السداء';
    } else if (i === 85) {
      status = 'maintenance';
      notes = 'فحص وصيانة كلوتش النول';
    }

    looms.push({
      id: `loom-${i}`,
      loomNumber: loomNumStr,
      code,
      hallId: isHall1 ? 'hall-1' : 'hall-2',
      hallName: isHall1 ? 'صالة النسيج الخامي' : 'صالة الجينز',
      groupId,
      groupName,
      manufacturer: 'Picanol',
      model: 'OptiMax-i-4-R 2017',
      year: 2017,
      rpm: isHall1 ? 560 : 540,
      picksPerCm: isHall1 ? 20 : 18,
      reedWidth: 220,
      fabricWidth: isHall1 ? 190 : 180,
      dailyOperatingHours: 24,
      shiftsCount: 3,
      defaultEfficiencyPercent: isHall1 ? 88 : 86,
      status,
      notes,
      currentOrderNumber: isHall1 ? 'PO-2026-GAB01' : 'PO-2026-DEN02',
      currentFabricName: isHall1 ? 'Gabardine 01 - قماش غابردين فاخر' : 'Denim Indigo 12oz - قماش دنيم جينز إنديغو',
      createdAt: new Date().toISOString(),
    });
  }

  const fabricItems: FabricItem[] = [
    {
      id: 'fab-1',
      code: 'FAB-GAB-01',
      name: 'Gabardine 01 - قماش غابردين فاخر',
      description: 'نسيج غابردين قطني 100% عالي المتانة للبدلات والزي الرسمي المقاوم للاحتكاك',
      warpYarnCount: 'Ne 30/2 Combed Cotton',
      weftYarnCount: 'Ne 20/1 Combed Cotton',
      yarnType: '100% Cotton Combed (قطن ممشط فاخر)',
      weaveStructure: 'توييل 2/1 (Twill 2/1)',
      reedWidth: 220,
      fabricWidth: 190,
      reedNumber: 16,
      endsPerDent: 2,
      warpDensity: 32,
      totalWarpEnds: 7040,
      weftDensity: 20,
      requiredRpm: 560,
      notes: 'صالة النسيج الخامي - 42 نول بيكانول اوبتي ماكس 2017',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fab-2',
      code: 'FAB-DEN-02',
      name: 'Denim Indigo 12oz - قماش دنيم جينز إنديغو',
      description: 'قماش دنيم جينز ثقيل وزن 12 أونصة مصبوغ نيلي عالي الجودة للألبسة العصرية',
      warpYarnCount: 'Ne 10/1 Ring Spun Indigo',
      weftYarnCount: 'Ne 12/1 Open-End',
      yarnType: 'Ring Spun Indigo Cotton (قطن إنديغو مغزول حلقي)',
      weaveStructure: 'توييل 3/1 (Twill 3/1 أصلي)',
      reedWidth: 220,
      fabricWidth: 180,
      reedNumber: 13,
      endsPerDent: 2,
      warpDensity: 26,
      totalWarpEnds: 5720,
      weftDensity: 18,
      requiredRpm: 540,
      notes: 'صالة الجينز - 54 نول بيكانول اوبتي ماكس 2017',
      createdAt: new Date().toISOString(),
    },
  ];

  const assignedGabLooms = looms.filter((l) => l.hallId === 'hall-1').map((l) => l.id);
  const assignedDenLooms = looms.filter((l) => l.hallId === 'hall-2').map((l) => l.id);

  const productionOrders: ProductionOrder[] = [
    {
      id: 'po-1',
      orderNumber: 'PO-2026-GAB01',
      fabricItemId: 'fab-1',
      fabricItemCode: 'FAB-GAB-01',
      fabricItemName: 'Gabardine 01 - قماش غابردين فاخر',
      requiredQuantityMeters: 100000,
      producedQuantityMeters: 38450,
      startDate: '2026-08-01',
      targetDeliveryDate: '2026-09-30',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الخامي',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الغابردين 1 - 21)',
      assignedLoomIds: assignedGabLooms,
      status: 'in_progress',
      notes: 'تشغيل صالة النسيج الخامي بالكامل (42 نول Picanol OptiMax-i 2017)',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'po-2',
      orderNumber: 'PO-2026-DEN02',
      fabricItemId: 'fab-2',
      fabricItemCode: 'FAB-DEN-02',
      fabricItemName: 'Denim Indigo 12oz - قماش دنيم جينز إنديغو',
      requiredQuantityMeters: 150000,
      producedQuantityMeters: 61800,
      startDate: '2026-08-05',
      targetDeliveryDate: '2026-10-15',
      hallId: 'hall-2',
      hallName: 'صالة الجينز',
      groupId: 'grp-3',
      groupName: 'المجموعة C (أنوال الدنيم 43 - 70)',
      assignedLoomIds: assignedDenLooms,
      status: 'in_progress',
      notes: 'تشغيل صالة الجينز بالكامل (54 نول Picanol OptiMax-i 2017)',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomAssignments: LoomAssignment[] = [
    {
      id: 'la-1',
      productionOrderId: 'po-1',
      loomId: 'loom-1',
      loomNumber: '1',
      dailyExpectedMeters: 290,
      producedMeters: 5400,
      remainingMeters: 2380,
      expectedDays: 8,
      status: 'active',
    },
    {
      id: 'la-2',
      productionOrderId: 'po-1',
      loomId: 'loom-2',
      loomNumber: '2',
      dailyExpectedMeters: 285,
      producedMeters: 5150,
      remainingMeters: 2630,
      expectedDays: 9,
      status: 'active',
    },
    {
      id: 'la-43',
      productionOrderId: 'po-2',
      loomId: 'loom-43',
      loomNumber: '43',
      dailyExpectedMeters: 310,
      producedMeters: 5800,
      remainingMeters: 3200,
      expectedDays: 10,
      status: 'active',
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const productionEntries: ProductionEntry[] = [
    {
      id: 'pe-1',
      date: todayStr,
      hallId: 'hall-1',
      hallName: 'صالة النسيج الخامي',
      groupId: 'grp-1',
      groupName: 'المجموعة A (أنوال الغابردين 1 - 21)',
      loomId: 'loom-1',
      loomNumber: '1',
      fabricItemId: 'fab-1',
      fabricItemName: 'Gabardine 01 - قماش غابردين فاخر',
      productionOrderId: 'po-1',
      orderNumber: 'PO-2026-GAB01',
      shift: 'shift_1',
      operatingHours: 7.5,
      downtimeHours: 0.5,
      actualMeters: 96,
      theoreticalMeters: 100.8,
      efficiencyPercent: 95.2,
      notes: 'إنتاجية ممتازة للغابردين في الوردية الصباحية',
      createdBy: 'مدير صالة النسيج الخامي',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pe-2',
      date: todayStr,
      hallId: 'hall-2',
      hallName: 'صالة الجينز',
      groupId: 'grp-3',
      groupName: 'المجموعة C (أنوال الدنيم 43 - 70)',
      loomId: 'loom-43',
      loomNumber: '43',
      fabricItemId: 'fab-2',
      fabricItemName: 'Denim Indigo 12oz - قماش دنيم جينز إنديغو',
      productionOrderId: 'po-2',
      orderNumber: 'PO-2026-DEN02',
      shift: 'shift_1',
      operatingHours: 7.2,
      downtimeHours: 0.8,
      actualMeters: 104,
      theoreticalMeters: 115.2,
      efficiencyPercent: 90.3,
      notes: 'إنتاجية دنيم جينز عالية ومستقرة',
      createdBy: 'مدير صالة الجينز',
      createdAt: new Date().toISOString(),
    },
  ];

  const loomStoppages: LoomStoppage[] = [
    {
      id: 'stp-1',
      loomId: 'loom-12',
      loomNumber: '12',
      hallId: 'hall-1',
      hallName: 'صالة النسيج الخامي',
      date: todayStr,
      startTime: '08:30',
      endTime: '10:00',
      durationMinutes: 90,
      reason: 'style_change',
      notes: 'تبديل مطواة السداء وضبط الشد الإلكتروني',
      createdBy: 'فني الصيانة والمراقبة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'stp-2',
      loomId: 'loom-62',
      loomNumber: '62',
      hallId: 'hall-2',
      hallName: 'صالة الجينز',
      date: todayStr,
      startTime: '09:15',
      endTime: '10:45',
      durationMinutes: 90,
      reason: 'warp_break',
      notes: 'عقد خيوط السداء وضبط حساس اللحمة',
      createdBy: 'فني الصيانة والمراقبة',
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
      newValue: 'تسجيل دخول ناجح لمدير النظام',
      timestamp: new Date().toISOString(),
    },
  ];

  const settings: SystemSettings = {
    factoryName: 'معمل النسيج والأنوال الحديث',
    departmentName: 'قسم النسيج والأنوال الإلكترونية (96 نول Picanol OptiMax 2017)',
    shifts: [
      { id: 'shift_1', name: 'الوردية الأولى (الصباحية)', startTime: '07:00', endTime: '15:00' },
      { id: 'shift_2', name: 'الوردية الثانية (المسائية)', startTime: '15:00', endTime: '23:00' },
      { id: 'shift_3', name: 'الوردية الثالثة (الليلية)', startTime: '23:00', endTime: '07:00' },
    ],
    defaultWorkingHours: 24,
    targetEfficiencyPercent: 88,
    alertLowEfficiencyThreshold: 75,
    alertLongDowntimeMinutes: 120,
    isDemoData: false,
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
