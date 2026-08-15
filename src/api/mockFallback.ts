import { Hall, LoomGroup, Loom, FabricItem, ProductionOrder, ProductionEntry, LoomStoppage, User, AuditLog, SystemSettings } from '../types';
import {
  ProductionCalculator,
  EfficiencyCalculator,
} from '../businessLogic/calculators';

const STORAGE_KEY = 'weaving_erp_client_db_v3';

interface LocalDB {
  users: User[];
  halls: Hall[];
  loomGroups: LoomGroup[];
  looms: Loom[];
  fabricItems: FabricItem[];
  productionOrders: ProductionOrder[];
  productionEntries: ProductionEntry[];
  loomStoppages: LoomStoppage[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const getInitialData = (): LocalDB => {
  const todayStr = new Date().toISOString().split('T')[0];

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
    defaultWorkingHours: 24,
    targetEfficiencyPercent: 88,
    alertLowEfficiencyThreshold: 75,
    alertLongDowntimeMinutes: 120,
    shifts: [
      { id: 'shift_1', name: 'الوردية الأولى (الصباحية)', startTime: '07:00', endTime: '15:00' },
      { id: 'shift_2', name: 'الوردية الثانية (المسائية)', startTime: '15:00', endTime: '23:00' },
      { id: 'shift_3', name: 'الوردية الثالثة (الليلية)', startTime: '23:00', endTime: '07:00' },
    ],
    isDemoData: false,
  };

  return {
    users,
    halls,
    loomGroups,
    looms,
    fabricItems,
    productionOrders,
    productionEntries,
    loomStoppages,
    auditLogs,
    settings,
  };
};

export function getLocalDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.looms || parsed.looms.length === 0 || !parsed.halls || parsed.halls.length === 0) {
      const initial = getInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    const initial = getInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

export function saveLocalDB(db: LocalDB) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Handle API requests in client-side mode when running as static SPA on Vercel
 */
export async function handleLocalMockRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const db = getLocalDB();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth Login
  if (endpoint === '/api/auth/login' && method === 'POST') {
    const { password, role, username } = body;
    if (!password) throw new Error('يرجى إدخال كلمة المرور');
    if (password !== '123789') throw new Error('كلمة المرور غير صحيحة (استخدم 123789)');

    let user = db.users.find((u) => u.role === role);
    if (!user && username) {
      user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    }
    if (!user) user = db.users[0];

    const token = `local-token-${Date.now()}`;
    return { token, user };
  }

  // Auth Me
  if (endpoint === '/api/auth/me') {
    const saved = localStorage.getItem('weaving_erp_user');
    const user = saved ? JSON.parse(saved) : db.users[0];
    return { user };
  }

  // Halls
  if (endpoint === '/api/halls') {
    if (method === 'GET') return db.halls;
    if (method === 'POST') {
      const newHall: Hall = {
        id: `hall-${Date.now()}`,
        number: body.number,
        name: body.name,
        description: body.description || '',
        totalLoomsCount: 0,
        status: body.status || 'active',
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
      };
      db.halls.push(newHall);
      saveLocalDB(db);
      return newHall;
    }
  }

  if (endpoint.startsWith('/api/halls/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.halls.findIndex((h) => h.id === id);
      if (idx !== -1) {
        db.halls[idx] = { ...db.halls[idx], ...body };
        saveLocalDB(db);
        return db.halls[idx];
      }
    }
    if (method === 'DELETE') {
      db.halls = db.halls.filter((h) => h.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Loom Groups
  if (endpoint === '/api/loom-groups') {
    if (method === 'GET') return db.loomGroups;
    if (method === 'POST') {
      const hall = db.halls.find((h) => h.id === body.hallId);
      const newGroup: LoomGroup = {
        id: `grp-${Date.now()}`,
        hallId: body.hallId,
        hallName: hall ? hall.name : '',
        name: body.name,
        description: body.description || '',
        loomCount: 0,
        createdAt: new Date().toISOString(),
      };
      db.loomGroups.push(newGroup);
      saveLocalDB(db);
      return newGroup;
    }
  }

  if (endpoint.startsWith('/api/loom-groups/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.loomGroups.findIndex((g) => g.id === id);
      if (idx !== -1) {
        db.loomGroups[idx] = { ...db.loomGroups[idx], ...body };
        saveLocalDB(db);
        return db.loomGroups[idx];
      }
    }
    if (method === 'DELETE') {
      db.loomGroups = db.loomGroups.filter((g) => g.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Looms
  if (endpoint === '/api/looms') {
    if (method === 'GET') return db.looms;
    if (method === 'POST') {
      const hall = db.halls.find((h) => h.id === body.hallId);
      const group = db.loomGroups.find((g) => g.id === body.groupId);
      const numPadded = String(body.loomNumber).padStart(2, '0');
      const finalCode = body.code || `PC-${numPadded}`;
      const newLoom: Loom = {
        id: `loom-${Date.now()}`,
        loomNumber: body.loomNumber,
        code: finalCode,
        hallId: body.hallId,
        hallName: hall ? hall.name : '',
        groupId: body.groupId || '',
        groupName: group ? group.name : '',
        manufacturer: body.manufacturer || 'Picanol',
        model: body.model || 'OptiMax-i-4-R 2017',
        year: Number(body.year) || 2017,
        rpm: Number(body.rpm) || 550,
        picksPerCm: Number(body.picksPerCm) || 20,
        reedWidth: Number(body.reedWidth) || 220,
        fabricWidth: Number(body.fabricWidth) || 190,
        dailyOperatingHours: Number(body.dailyOperatingHours) || 24,
        shiftsCount: Number(body.shiftsCount) || 3,
        defaultEfficiencyPercent: Number(body.defaultEfficiencyPercent) || 88,
        status: body.status || 'running',
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
      };
      db.looms.push(newLoom);
      saveLocalDB(db);
      return newLoom;
    }
  }

  if (endpoint.startsWith('/api/looms/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.looms.findIndex((l) => l.id === id);
      if (idx !== -1) {
        db.looms[idx] = { ...db.looms[idx], ...body };
        saveLocalDB(db);
        return db.looms[idx];
      }
    }
    if (method === 'DELETE') {
      db.looms = db.looms.filter((l) => l.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Fabric Items
  if (endpoint === '/api/fabric-items') {
    if (method === 'GET') return db.fabricItems;
    if (method === 'POST') {
      const rWidth = Number(body.reedWidth) || 220;
      const fWidth = Number(body.fabricWidth) || 190;
      const wDensity = Number(body.warpDensity) || 30;
      const ends = Number(body.totalWarpEnds) || Math.round(wDensity * rWidth);
      const newFab: FabricItem = {
        id: `fab-${Date.now()}`,
        code: body.code,
        name: body.name,
        weaveStructure: body.weaveStructure || 'سادة 1/1',
        yarnType: body.yarnType || 'قطن',
        warpDensity: wDensity,
        totalWarpEnds: ends,
        reedNumber: body.reedNumber ? (isNaN(Number(body.reedNumber)) ? body.reedNumber : Number(body.reedNumber)) : undefined,
        endsPerDent: body.endsPerDent ? Number(body.endsPerDent) : undefined,
        weftDensity: Number(body.weftDensity) || 20,
        reedWidth: rWidth,
        fabricWidth: fWidth,
        requiredRpm: Number(body.requiredRpm) || 550,
        warpYarnCount: body.warpYarnCount || '',
        weftYarnCount: body.weftYarnCount || '',
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
      };
      db.fabricItems.push(newFab);
      saveLocalDB(db);
      return newFab;
    }
  }

  if (endpoint.startsWith('/api/fabric-items/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.fabricItems.findIndex((f) => f.id === id);
      if (idx !== -1) {
        db.fabricItems[idx] = { ...db.fabricItems[idx], ...body };
        saveLocalDB(db);
        return db.fabricItems[idx];
      }
    }
    if (method === 'DELETE') {
      db.fabricItems = db.fabricItems.filter((f) => f.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Production Orders
  if (endpoint === '/api/production-orders') {
    if (method === 'GET') return db.productionOrders;
    if (method === 'POST') {
      const fabric = db.fabricItems.find((f) => f.id === body.fabricItemId);
      const hall = db.halls.find((h) => h.id === body.hallId);
      const newOrder: ProductionOrder = {
        id: `po-${Date.now()}`,
        orderNumber: body.orderNumber,
        fabricItemId: body.fabricItemId,
        fabricItemCode: fabric ? fabric.code : '',
        fabricItemName: fabric ? fabric.name : '',
        requiredQuantityMeters: Number(body.requiredQuantityMeters),
        producedQuantityMeters: 0,
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        targetDeliveryDate: body.targetDeliveryDate || '',
        hallId: body.hallId,
        hallName: hall ? hall.name : '',
        assignedLoomIds: Array.isArray(body.assignedLoomIds) ? body.assignedLoomIds : [],
        status: 'in_progress',
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
      };
      db.productionOrders.push(newOrder);
      saveLocalDB(db);
      return newOrder;
    }
  }

  if (endpoint.startsWith('/api/production-orders/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.productionOrders.findIndex((o) => o.id === id);
      if (idx !== -1) {
        db.productionOrders[idx] = { ...db.productionOrders[idx], ...body };
        saveLocalDB(db);
        return db.productionOrders[idx];
      }
    }
    if (method === 'DELETE') {
      db.productionOrders = db.productionOrders.filter((o) => o.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Production Entries
  if (endpoint === '/api/production-entries') {
    if (method === 'GET') return db.productionEntries;
    if (method === 'POST') {
      const loom = db.looms.find((l) => l.id === body.loomId);
      const hall = db.halls.find((h) => h.id === body.hallId);
      const group = db.loomGroups.find((g) => g.id === body.groupId);
      const fabric = db.fabricItems.find((f) => f.id === body.fabricItemId);
      const order = db.productionOrders.find((po) => po.id === body.productionOrderId);

      const opHours = Number(body.operatingHours) || 8;
      const rpm = loom ? loom.rpm : 500;
      const picksPerCm = fabric ? fabric.weftDensity : (loom ? loom.picksPerCm : 20);
      const theoreticalMeters = ProductionCalculator.shiftTheoreticalMeters(rpm, picksPerCm, opHours);
      const efficiencyPercent = EfficiencyCalculator.calculateEfficiencyPercent(
        Number(body.actualMeters),
        theoreticalMeters
      );

      const newEntry: ProductionEntry = {
        id: `pe-${Date.now()}`,
        date: body.date,
        hallId: hall ? hall.id : '',
        hallName: hall ? hall.name : '',
        groupId: group ? group.id : '',
        groupName: group ? group.name : '',
        loomId: body.loomId,
        loomNumber: loom ? loom.loomNumber : '',
        fabricItemId: fabric ? fabric.id : '',
        fabricItemName: fabric ? fabric.name : '',
        productionOrderId: body.productionOrderId,
        orderNumber: order ? order.orderNumber : '',
        shift: body.shift,
        operatingHours: opHours,
        downtimeHours: Number(body.downtimeHours) || 0,
        actualMeters: Number(body.actualMeters),
        theoreticalMeters,
        efficiencyPercent,
        notes: body.notes || '',
        createdBy: 'المسجل (مدير الصالة)',
        createdAt: new Date().toISOString(),
      };

      db.productionEntries.unshift(newEntry);
      if (order) {
        order.producedQuantityMeters += Number(body.actualMeters);
      }
      saveLocalDB(db);
      return newEntry;
    }
  }

  // Stoppages
  if (endpoint === '/api/stoppages') {
    if (method === 'GET') return db.loomStoppages;
    if (method === 'POST') {
      const loom = db.looms.find((l) => l.id === body.loomId);
      const hall = db.halls.find((h) => h.id === body.hallId);
      const newStoppage: LoomStoppage = {
        id: `stp-${Date.now()}`,
        loomId: body.loomId,
        loomNumber: loom ? loom.loomNumber : '',
        hallId: hall ? hall.id : '',
        hallName: hall ? hall.name : '',
        date: body.date || new Date().toISOString().split('T')[0],
        startTime: body.startTime,
        endTime: body.endTime || '',
        durationMinutes: Number(body.durationMinutes) || 60,
        reason: body.reason,
        notes: body.notes || '',
        createdBy: 'فني الصيانة والمراقبة',
        createdAt: new Date().toISOString(),
      };
      db.loomStoppages.unshift(newStoppage);
      saveLocalDB(db);
      return newStoppage;
    }
  }

  // Notifications
  if (endpoint === '/api/notifications') {
    const notifs: any[] = [];
    db.looms.filter((l) => l.status === 'stopped' || l.status === 'maintenance').forEach((l) => {
      notifs.push({
        id: `notif-loom-${l.id}`,
        type: 'warning',
        title: `نول ${l.loomNumber} متوقف أو تحت الصيانة`,
        message: `النول رقم ${l.loomNumber} في صالة ${l.hallName} متوقف حالياً.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    db.productionOrders.filter((o) => o.status === 'delayed').forEach((o) => {
      notifs.push({
        id: `notif-order-${o.id}`,
        type: 'alert',
        title: `أمر إنتاج متأخر: ${o.orderNumber}`,
        message: `أمر التشغيل رقم ${o.orderNumber} لصنف ${o.fabricItemName || ''} متأخر.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    return notifs;
  }

  // Users
  if (endpoint === '/api/users') {
    if (method === 'GET') return db.users;
    if (method === 'POST') {
      const newUser: User = {
        id: `u-${Date.now()}`,
        username: body.username,
        fullName: body.fullName,
        role: body.role,
        assignedHallId: body.assignedHallId,
        active: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveLocalDB(db);
      return newUser;
    }
  }

  if (endpoint.startsWith('/api/users/')) {
    const id = endpoint.split('/')[3];
    if (method === 'PUT') {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...body };
        saveLocalDB(db);
        return db.users[idx];
      }
    }
    if (method === 'DELETE') {
      db.users = db.users.filter((u) => u.id !== id);
      saveLocalDB(db);
      return { success: true };
    }
  }

  // Audit Logs
  if (endpoint === '/api/audit-logs') {
    return db.auditLogs;
  }

  // Change Password
  if (endpoint === '/api/auth/change-password' && method === 'POST') {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) throw new Error('يرجى ملء جميع الحقول');
    if (currentPassword !== '123789') throw new Error('كلمة المرور الحالية غير صحيحة');
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  // Settings
  if (endpoint === '/api/settings/reset-demo' && method === 'POST') {
    const initial = getInitialData();
    saveLocalDB(initial);
    return { success: true, message: 'تمت استعادة البيانات التجريبية بنجاح' };
  }

  if (endpoint === '/api/settings') {
    if (method === 'GET') return db.settings;
    if (method === 'PUT') {
      db.settings = { ...db.settings, ...body };
      saveLocalDB(db);
      return db.settings;
    }
  }

  return [];
}
