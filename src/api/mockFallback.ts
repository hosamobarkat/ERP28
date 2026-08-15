import { Hall, LoomGroup, Loom, FabricItem, ProductionOrder, ProductionEntry, LoomStoppage, User, AuditLog, SystemSettings } from '../types';
import {
  ProductionCalculator,
  EfficiencyCalculator,
} from '../businessLogic/calculators';

const STORAGE_KEY = 'weaving_erp_client_db_v1';

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
  return {
    users: [
      {
        id: 'u-1',
        username: 'admin',
        fullName: 'مدير النظام (المدير العام)',
        role: 'manager',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'u-2',
        username: 'coordinator',
        fullName: 'منسق عام الإنتاج والتخطيط',
        role: 'coordinator',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'u-3',
        username: 'hall_manager',
        fullName: 'مدير صالة النسيج الأولى',
        role: 'hall_manager',
        assignedHallId: 'hall-1',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
    halls: [
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
    ],
    loomGroups: [
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
    ],
    looms: [
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
        picksPerCm: 20,
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
        manufacturer: 'Dornier',
        model: 'P1 Rapier 2022',
        year: 2022,
        rpm: 510,
        picksPerCm: 20,
        reedWidth: 220,
        fabricWidth: 190,
        dailyOperatingHours: 24,
        shiftsCount: 3,
        defaultEfficiencyPercent: 85,
        status: 'running',
        notes: 'جاهز للإنتاج',
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
        manufacturer: 'Sulzer',
        model: 'G6300 Rapier',
        year: 2020,
        rpm: 480,
        picksPerCm: 22,
        reedWidth: 200,
        fabricWidth: 180,
        dailyOperatingHours: 24,
        shiftsCount: 3,
        defaultEfficiencyPercent: 82,
        status: 'running',
        notes: 'تمت الصيانة الدورية مؤخراً',
        currentOrderNumber: 'PO-2026-002',
        currentFabricName: 'Poplin 02 - قماش بوبلين ملون',
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
        manufacturer: 'Toyota',
        model: 'JAT810 Airjet',
        year: 2023,
        rpm: 800,
        picksPerCm: 18,
        reedWidth: 190,
        fabricWidth: 170,
        dailyOperatingHours: 24,
        shiftsCount: 3,
        defaultEfficiencyPercent: 90,
        status: 'running',
        notes: 'أعلى نول إنتاجية وسرعة',
        currentOrderNumber: 'PO-2026-002',
        currentFabricName: 'Poplin 02 - قماش بوبلين ملون',
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
        manufacturer: 'Toyota',
        model: 'JAT710 Airjet',
        year: 2019,
        rpm: 720,
        picksPerCm: 18,
        reedWidth: 190,
        fabricWidth: 170,
        dailyOperatingHours: 24,
        shiftsCount: 3,
        defaultEfficiencyPercent: 78,
        status: 'stopped',
        notes: 'توقف مؤقت لأعمال ضبط الشد والمشط',
        createdAt: new Date().toISOString(),
      },
    ],
    fabricItems: [
      {
        id: 'fab-1',
        code: 'FAB-GAB-01',
        name: 'Gabardine 01 - قماش جابردين فاخر',
        weaveStructure: 'توييل 2/1 (Twill 2/1)',
        yarnType: '100% قطن مصري فاخر',
        warpDensity: 32,
        weftDensity: 20,
        reedWidth: 220,
        fabricWidth: 190,
        requiredRpm: 520,
        requiredProductionMeters: 5000,
        warpYarnCount: '30/2 Ne قطن ممشط',
        weftYarnCount: '20/1 Ne قطن ممشط',
        notes: 'قماش عالي المتانة للبناطيل والبدلات',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'fab-2',
        code: 'FAB-POP-02',
        name: 'Poplin 02 - قماش بوبلين ملون',
        weaveStructure: 'سادة 1/1 (Plain 1/1)',
        yarnType: 'قطن مخلوط',
        warpDensity: 40,
        weftDensity: 24,
        reedWidth: 190,
        fabricWidth: 170,
        requiredRpm: 750,
        requiredProductionMeters: 10000,
        warpYarnCount: '40/1 Ne قطن',
        weftYarnCount: '40/1 Ne قطن',
        notes: 'قماش خفيف للقمصان الفاخرة',
        createdAt: new Date().toISOString(),
      },
    ],
    productionOrders: [
      {
        id: 'po-1',
        orderNumber: 'PO-2026-001',
        fabricItemId: 'fab-1',
        fabricItemCode: 'FAB-GAB-01',
        fabricItemName: 'Gabardine 01 - قماش جابردين فاخر',
        requiredQuantityMeters: 5000,
        producedQuantityMeters: 1720,
        startDate: '2026-08-01',
        targetDeliveryDate: '2026-08-25',
        hallId: 'hall-1',
        hallName: 'صالة النسيج الرئيسية 1',
        assignedLoomIds: ['loom-1', 'loom-2'],
        status: 'in_progress',
        notes: 'طلب عاجل للسوق المحلي بجودة تصدير',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'po-2',
        orderNumber: 'PO-2026-002',
        fabricItemId: 'fab-2',
        fabricItemCode: 'FAB-POP-02',
        fabricItemName: 'Poplin 02 - قماش بوبلين ملون',
        requiredQuantityMeters: 10000,
        producedQuantityMeters: 4200,
        startDate: '2026-08-05',
        targetDeliveryDate: '2026-08-30',
        hallId: 'hall-1',
        hallName: 'صالة النسيج الرئيسية 1',
        assignedLoomIds: ['loom-3', 'loom-4'],
        status: 'in_progress',
        notes: 'تسليم مرحلي أسبوعي',
        createdAt: new Date().toISOString(),
      },
    ],
    productionEntries: [
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
        createdBy: 'مدير الصالة (مشرف الوردية)',
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
        createdBy: 'مدير الصالة (مشرف الوردية)',
        createdAt: new Date().toISOString(),
      },
    ],
    loomStoppages: [
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
        createdBy: 'فني الصيانة والمراقبة',
        createdAt: new Date().toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 'log-1',
        userId: 'u-1',
        username: 'admin',
        role: 'manager',
        action: 'login',
        targetEntity: 'نظام ERP قسم النسيج',
        newValue: 'تسجيل دخول ناجح لحساب مدير النظام',
        timestamp: new Date().toISOString(),
      },
    ],
    settings: {
      factoryName: 'مصنع النسيج الحديث',
      departmentName: 'قسم النسيج والتحضيرات',
      defaultWorkingHours: 24,
      targetEfficiencyPercent: 85,
      alertLowEfficiencyThreshold: 75,
      alertLongDowntimeMinutes: 120,
      shifts: [
        { id: 'shift_1', name: 'الوردية الأولى (الصباحية)', startTime: '07:00', endTime: '15:00' },
        { id: 'shift_2', name: 'الوردية الثانية (المسائية)', startTime: '15:00', endTime: '23:00' },
        { id: 'shift_3', name: 'الوردية الثالثة (الليلية)', startTime: '23:00', endTime: '07:00' },
      ],
      isDemoData: true,
    },
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
    return JSON.parse(raw);
  } catch {
    return getInitialData();
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
      const newLoom: Loom = {
        id: `loom-${Date.now()}`,
        loomNumber: body.loomNumber,
        code: body.code || `NOL-${body.loomNumber}`,
        hallId: body.hallId,
        hallName: hall ? hall.name : '',
        groupId: body.groupId || '',
        groupName: group ? group.name : '',
        manufacturer: body.manufacturer,
        model: body.model || '',
        year: Number(body.year) || 2023,
        rpm: Number(body.rpm) || 500,
        picksPerCm: Number(body.picksPerCm) || 20,
        reedWidth: Number(body.reedWidth) || 220,
        fabricWidth: Number(body.fabricWidth) || 190,
        dailyOperatingHours: Number(body.dailyOperatingHours) || 24,
        shiftsCount: Number(body.shiftsCount) || 3,
        defaultEfficiencyPercent: Number(body.defaultEfficiencyPercent) || 85,
        status: body.status || 'stopped',
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
      const newFab: FabricItem = {
        id: `fab-${Date.now()}`,
        code: body.code,
        name: body.name,
        weaveStructure: body.weaveStructure || 'سادة 1/1',
        yarnType: body.yarnType || 'قطن',
        warpDensity: Number(body.warpDensity) || 30,
        weftDensity: Number(body.weftDensity) || 20,
        reedWidth: Number(body.reedWidth) || 220,
        fabricWidth: Number(body.fabricWidth) || 190,
        requiredRpm: Number(body.requiredRpm) || 500,
        requiredProductionMeters: Number(body.requiredProductionMeters) || 5000,
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

  // Settings
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
