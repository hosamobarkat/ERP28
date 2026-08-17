import { 
  PurchaseOrderItem, 
  WarehouseStockItem, 
  Withdrawal, 
  InventoryMovement, 
  SystemNotification,
  AuditLog,
  PurchaseRecommendation,
  OrderStatus,
  OriginCode
} from '../types';
import { calculatePOTolerance } from '../utils/poUtils';
import { 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_WAREHOUSE_STOCK, 
  INITIAL_WITHDRAWALS, 
  INITIAL_MOVEMENTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';

const KEYS = {
  PURCHASES: 'yarn_erp_purchases_v2',
  STOCK: 'yarn_erp_stock_v2',
  WITHDRAWALS: 'yarn_erp_withdrawals_v2',
  MOVEMENTS: 'yarn_erp_movements_v2',
  NOTIFICATIONS: 'yarn_erp_notifications_v2',
  AUDIT_LOGS: 'yarn_erp_audit_logs_v2',
};

class StorageService {
  private purchases: PurchaseOrderItem[] = [];
  private stock: WarehouseStockItem[] = [];
  private withdrawals: Withdrawal[] = [];
  private movements: InventoryMovement[] = [];
  private notifications: SystemNotification[] = [];
  private auditLogs: AuditLog[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  public initFromLocalStorage() {
    this.init();
    this.notifyListeners();
  }

  private init() {
    try {
      // Always reset local storage once to ensure clean zeroed state as requested
      if (localStorage.getItem('yarn_erp_v4_zeroed') !== 'true') {
        localStorage.removeItem(KEYS.PURCHASES);
        localStorage.removeItem(KEYS.STOCK);
        localStorage.removeItem(KEYS.WITHDRAWALS);
        localStorage.removeItem(KEYS.MOVEMENTS);
        localStorage.removeItem(KEYS.NOTIFICATIONS);
        localStorage.setItem('yarn_erp_v4_zeroed', 'true');
      }

      const p = localStorage.getItem(KEYS.PURCHASES);
      this.purchases = p ? JSON.parse(p) : [];

      const s = localStorage.getItem(KEYS.STOCK);
      this.stock = s ? JSON.parse(s) : [];

      const w = localStorage.getItem(KEYS.WITHDRAWALS);
      this.withdrawals = w ? JSON.parse(w) : [];

      const m = localStorage.getItem(KEYS.MOVEMENTS);
      this.movements = m ? JSON.parse(m) : [];

      const n = localStorage.getItem(KEYS.NOTIFICATIONS);
      this.notifications = n ? JSON.parse(n) : [];

      const a = localStorage.getItem(KEYS.AUDIT_LOGS);
      this.auditLogs = a ? JSON.parse(a) : [
        {
          id: 'log-1',
          userName: 'مدير النظام',
          userRole: 'admin',
          action: 'تصفير وتأسيس النظام',
          details: 'تم تصفير النظام بالكامل والجاهزية لاستقبال ملفات الإكسل المستقلة',
          timestamp: new Date().toISOString()
        }
      ];

      // Auto-recalculate inventory integrity
      this.recalculateInventoryIntegrity();
    } catch (err) {
      console.error('Error initializing StorageService:', err);
      this.purchases = [];
      this.stock = [];
      this.withdrawals = [];
      this.movements = [];
      this.notifications = [];
      this.recalculateInventoryIntegrity();
    }
  }

  /**
   * Guarantees all initial inventory check items exist in warehouse stock
   * using the rule: Yarn Count + Lot Number + Cone Length
   */
  private syncInventoryChecksToStock() {
    const normalize = (str?: string) => (str || '').trim().toLowerCase();

    this.purchases.forEach(po => {
      if ((po.isInventoryCheck || po.expectedReadinessDate === 'جرد') && po.receivedWeightKg > 0) {
        const poLot = (po.lotNumber || `LOT-${po.poNumber.replace('PO-2026-', '')}`).trim();
        
        const exists = this.stock.some(s =>
          normalize(s.yarnCount) === normalize(po.yarnCount) &&
          normalize(s.origin) === normalize(po.origin) &&
          normalize(s.lotNumber) === normalize(poLot) &&
          Number(s.coneLength) === Number(po.coneLength)
        );

        if (!exists) {
          this.stock.push({
            id: 'wh-sync-' + po.id,
            yarnCount: po.yarnCount,
            origin: po.origin,
            coneLength: po.coneLength,
            lotNumber: poLot,
            totalReceivedKg: po.receivedWeightKg,
            totalReceivedCones: po.receivedConesCount || 0,
            totalWithdrawnKg: 0,
            totalWithdrawnCones: 0,
            netWeightKg: po.receivedWeightKg,
            netCones: po.receivedConesCount || 0,
            usage: 'WEFT GR',
            minStockKg: 1000,
            maxStockKg: 10000,
            warehouseName: 'مستودع الغزول الرئيسي'
          });
        }
      }
    });
  }

  private save() {
    try {
      localStorage.setItem(KEYS.PURCHASES, JSON.stringify(this.purchases));
      localStorage.setItem(KEYS.STOCK, JSON.stringify(this.stock));
      localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(this.withdrawals));
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(this.movements));
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  /**
   * Recalculate warehouse balances strictly from Received minus Withdrawn.
   * Rule: Warehouse inventory is NEVER manually set.
   */
  public recalculateInventoryIntegrity() {
    const normalize = (str?: string) => (str || '').trim().toLowerCase();

    this.stock.forEach(item => {
      // Find matching withdrawals based on yarnCount, origin, coneLength, and lotNumber
      const matchingWithdrawals = this.withdrawals.filter(
        w => normalize(w.yarnCount) === normalize(item.yarnCount) &&
             normalize(w.origin) === normalize(item.origin) &&
             Number(w.coneLength) === Number(item.coneLength) &&
             (!w.lotNumber || normalize(w.lotNumber) === normalize(item.lotNumber))
      );

      const totalWithdrawnKg = matchingWithdrawals.reduce((sum, w) => sum + Number(w.withdrawnKg || 0), 0);
      const totalWithdrawnCones = matchingWithdrawals.reduce((sum, w) => sum + Number(w.withdrawnCones || 0), 0);

      item.totalWithdrawnKg = Math.round(totalWithdrawnKg * 100) / 100;
      item.totalWithdrawnCones = totalWithdrawnCones;
      
      // Calculate Net Balance
      item.netWeightKg = Math.round((item.totalReceivedKg - item.totalWithdrawnKg) * 100) / 100;
      item.netCones = Math.max(0, item.totalReceivedCones - item.totalWithdrawnCones);
    });
  }

  // --- GETTERS ---
  public getPurchaseOrders(): PurchaseOrderItem[] {
    return [...this.purchases];
  }

  public getWarehouseStock(): WarehouseStockItem[] {
    this.recalculateInventoryIntegrity();
    return [...this.stock];
  }

  public getWithdrawals(): Withdrawal[] {
    return [...this.withdrawals];
  }

  public getMovements(): InventoryMovement[] {
    return [...this.movements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- BUSINESS ACTIONS ---

  /**
   * Create or Update a Purchase Order
   */
  public addPurchaseOrder(item: Omit<PurchaseOrderItem, 'id' | 'pendingWeightKg' | 'createdAt'>): PurchaseOrderItem {
    const tol = calculatePOTolerance(item.totalRequiredWeightKg, item.receivedWeightKg || 0);
    
    const newPo: PurchaseOrderItem = {
      ...item,
      id: 'po-' + Date.now(),
      poNumber: item.poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      pendingWeightKg: tol.pendingWeightKg,
      status: tol.status,
      createdAt: new Date().toISOString()
    };

    this.purchases.unshift(newPo);

    // If initial received weight > 0, process receiving into warehouse stock
    if (newPo.receivedWeightKg > 0) {
      this.processGoodsReceiving(newPo.id, newPo.receivedWeightKg, newPo.receivedConesCount, 'استلام أولي عند الإنشاء');
    }

    this.logAudit('مدير المشتريات', 'purchasing', 'إضافة طلبية شراء', `تمت إضافة الطلبية ${newPo.poNumber} بالنمرة ${newPo.yarnCount}`);
    this.save();
    return newPo;
  }

  /**
   * Process Goods Receiving (استلام مشتريات)
   */
  public processGoodsReceiving(poId: string, qtyKg: number, qtyCones: number, notes?: string): void {
    const poIndex = this.purchases.findIndex(p => p.id === poId);
    if (poIndex === -1) throw new Error('طلبية الشراء غير موجودة');

    const po = this.purchases[poIndex];
    const prevReceivedKg = po.receivedWeightKg || 0;
    const prevReceivedCones = po.receivedConesCount || 0;

    const newReceivedKg = Math.round((prevReceivedKg + qtyKg) * 100) / 100;
    const newReceivedCones = prevReceivedCones + qtyCones;
    const tol = calculatePOTolerance(po.totalRequiredWeightKg, newReceivedKg);

    this.purchases[poIndex] = {
      ...po,
      receivedWeightKg: newReceivedKg,
      receivedConesCount: newReceivedCones,
      pendingWeightKg: tol.pendingWeightKg,
      status: tol.status
    };

    // Update or Create Warehouse Stock Record
    const normalize = (str?: string) => (str || '').trim().toLowerCase();
    const poLot = (po.lotNumber || `LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`).trim();

    let stockItem = this.stock.find(
      s => normalize(s.yarnCount) === normalize(po.yarnCount) &&
           normalize(s.origin) === normalize(po.origin) &&
           normalize(s.lotNumber) === normalize(poLot) &&
           Number(s.coneLength) === Number(po.coneLength)
    );

    if (!stockItem) {
      stockItem = {
        id: 'wh-' + Date.now(),
        yarnCount: po.yarnCount,
        origin: po.origin,
        coneLength: po.coneLength,
        lotNumber: poLot,
        totalReceivedKg: qtyKg,
        totalReceivedCones: qtyCones,
        totalWithdrawnKg: 0,
        totalWithdrawnCones: 0,
        netWeightKg: qtyKg,
        netCones: qtyCones,
        usage: 'WEFT GR',
        minStockKg: 2000,
        maxStockKg: 20000,
        warehouseName: 'مستودع الغزول الرئيسي'
      };
      this.stock.push(stockItem);
    } else {
      stockItem.totalReceivedKg = Math.round((stockItem.totalReceivedKg + qtyKg) * 100) / 100;
      stockItem.totalReceivedCones += qtyCones;
    }

    this.recalculateInventoryIntegrity();

    // Log Inventory Movement
    const movement: InventoryMovement = {
      id: 'mov-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'RECEIPT',
      typeAr: 'إستلام مشتريات',
      referenceNo: po.poNumber || poId,
      yarnCount: po.yarnCount,
      origin: po.origin,
      coneLength: po.coneLength,
      weightChangeKg: qtyKg,
      conesChange: qtyCones,
      runningBalanceKg: stockItem.netWeightKg,
      runningBalanceCones: stockItem.netCones,
      departmentOrSupplier: `المورد (${po.origin})`,
      notes: notes || 'استلام مشتريات واردة',
      operator: 'أمين المستودع'
    };
    this.movements.unshift(movement);

    // Create Notification
    this.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: 'استلام كمية مشتريات',
      message: `تم استلام ${qtyKg} كجم من ${po.yarnCount} للطلبية ${po.poNumber}.`,
      type: 'success',
      date: new Date().toISOString().split('T')[0],
      read: false
    });

    this.logAudit('أمين المستودع', 'warehouse_manager', 'استلام مشتريات', `استلام ${qtyKg} كجم للطلبية ${po.poNumber}`);
    this.save();
  }

  /**
   * Create a Withdrawal (سحب من المستودع) with strict backend availability check
   */
  public addWithdrawal(withdrawalData: Omit<Withdrawal, 'id' | 'createdAt'>): Withdrawal {
    // 1. Locate stock item
    const normalize = (str?: string) => (str || '').trim().toLowerCase();
    const stockItem = this.stock.find(
      s => normalize(s.yarnCount) === normalize(withdrawalData.yarnCount) &&
           normalize(s.origin) === normalize(withdrawalData.origin) &&
           Number(s.coneLength) === Number(withdrawalData.coneLength) &&
           (!withdrawalData.lotNumber || normalize(s.lotNumber) === normalize(withdrawalData.lotNumber))
    );

    if (!stockItem) {
      throw new Error(`عذراً، نمرة الخيط "${withdrawalData.yarnCount}" بمصدر "${withdrawalData.origin}" واللوط "${withdrawalData.lotNumber || '-'}" وطول كونة "${withdrawalData.coneLength}" غير متوفرة في المستودع.`);
    }

    // 2. Strict Check: Available Stock
    const currentAvailableKg = stockItem.netWeightKg;
    if (withdrawalData.withdrawnKg > currentAvailableKg) {
      throw new Error(`الكمية المطلوبة (${withdrawalData.withdrawnKg} كجم) تتجاوز الرصيد المتاح حالياً في المستودع (${currentAvailableKg} كجم). لا يمكن إتمام عملية السحب.`);
    }

    // 3. Create Withdrawal
    const newWithdrawal: Withdrawal = {
      ...withdrawalData,
      id: 'wtd-' + Date.now(),
      withdrawalNumber: withdrawalData.withdrawalNumber || `WTH-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString()
    };

    this.withdrawals.unshift(newWithdrawal);

    // 4. Recalculate Warehouse Inventory
    this.recalculateInventoryIntegrity();

    // 5. Record Movement Ledger
    const updatedStockItem = this.stock.find(s => s.id === stockItem.id)!;
    const movement: InventoryMovement = {
      id: 'mov-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'WITHDRAWAL',
      typeAr: 'صرف سحوبات',
      referenceNo: newWithdrawal.withdrawalNumber,
      yarnCount: newWithdrawal.yarnCount,
      origin: newWithdrawal.origin,
      coneLength: newWithdrawal.coneLength,
      weightChangeKg: -newWithdrawal.withdrawnKg,
      conesChange: -newWithdrawal.withdrawnCones,
      runningBalanceKg: updatedStockItem.netWeightKg,
      runningBalanceCones: updatedStockItem.netCones,
      departmentOrSupplier: `قسم ${newWithdrawal.department}`,
      notes: newWithdrawal.notes || `صرف لأمر الإنتاج ${newWithdrawal.productionOrder || '-'}`,
      operator: newWithdrawal.operatorName || 'مشغل المستودع'
    };
    this.movements.unshift(movement);

    // Check low stock trigger
    if (updatedStockItem.netWeightKg <= updatedStockItem.minStockKg) {
      this.notifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'تنبيه انخفاض المخزون!',
        message: `وصل رصيد ${updatedStockItem.yarnCount} (${updatedStockItem.origin}) إلى ${updatedStockItem.netWeightKg} كجم وهو ما يقل عن الحد الأدنى (${updatedStockItem.minStockKg} كجم).`,
        type: 'danger',
        date: new Date().toISOString().split('T')[0],
        read: false
      });
    }

    this.logAudit('مشغل المستودع', 'production', 'سحب مواد من المستودع', `تم صرف ${newWithdrawal.withdrawnKg} كجم إلى قسم ${newWithdrawal.department}`);
    this.save();
    return newWithdrawal;
  }

  /**
   * Generate Smart Purchase Recommendations
   */
  public generatePurchaseRecommendations(): PurchaseRecommendation[] {
    const recommendations: PurchaseRecommendation[] = [];
    const stockItems = this.getWarehouseStock();
    const poItems = this.getPurchaseOrders();
    const withdrawals = this.getWithdrawals();

    stockItems.forEach(stock => {
      // Pending PO quantity for this yarn
      const pendingPoKg = poItems
        .filter(po => po.yarnCount.trim() === stock.yarnCount.trim() && po.origin.trim() === stock.origin.trim() && po.status !== 'completed' && po.status !== 'cancelled')
        .reduce((sum, po) => sum + Math.max(0, po.pendingWeightKg), 0);

      // Average monthly consumption based on withdrawals
      const itemWithdrawals = withdrawals.filter(
        w => w.yarnCount.trim() === stock.yarnCount.trim() && w.origin.trim() === stock.origin.trim()
      );
      const totalWithdrawn = itemWithdrawals.reduce((sum, w) => sum + w.withdrawnKg, 0);
      const avgMonthly = totalWithdrawn > 0 ? Math.max(totalWithdrawn * 1.5, 3000) : 2500;

      const currentStock = stock.netWeightKg;
      const effectiveStock = currentStock + pendingPoKg;

      // Rule: if effective stock < minStockThreshold or < avgMonthly
      if (effectiveStock < stock.minStockKg * 1.5 || currentStock < stock.minStockKg) {
        let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        let reason = '';

        if (currentStock < stock.minStockKg) {
          urgency = 'HIGH';
          reason = `الرصيد الحالي (${currentStock} كجم) دون الحد الأدنى المطلوب (${stock.minStockKg} كجم).`;
        } else if (pendingPoKg > 0) {
          urgency = 'MEDIUM';
          reason = `الرصيد يغطي الاستهلاك القريب ولكن شحنات قيد الانتظار تحتاج متابعة التوريد.`;
        } else {
          urgency = 'LOW';
          reason = `الرصيد يقترب من حد إعادة الطلب بناءً على متوسط الاستهلاك الشهري.`;
        }

        const suggestedKg = Math.max(1000, Math.round((stock.minStockKg * 2 + avgMonthly - effectiveStock) / 100) * 100);
        const today = new Date();
        const dateOffset = urgency === 'HIGH' ? 3 : urgency === 'MEDIUM' ? 7 : 14;
        today.setDate(today.getDate() + dateOffset);

        recommendations.push({
          yarnCount: stock.yarnCount,
          origin: stock.origin,
          coneLength: stock.coneLength,
          currentStockKg: currentStock,
          pendingPoKg: pendingPoKg,
          avgMonthlyConsumptionKg: avgMonthly,
          minStockThresholdKg: stock.minStockKg,
          suggestedOrderKg: suggestedKg,
          suggestedOrderDate: today.toISOString().split('T')[0],
          urgency: urgency,
          reason: reason
        });
      }
    });

    return recommendations.sort((a, b) => (a.urgency === 'HIGH' ? -1 : b.urgency === 'HIGH' ? 1 : 0));
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.save();
    }
  }

  public clearNotifications() {
    this.notifications = [];
    this.save();
  }

  public logAudit(userName: string, userRole: any, action: string, details: string) {
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      userName,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  public addWarehouseStockItem(
    itemData: Omit<WarehouseStockItem, 'id' | 'netWeightKg' | 'netCones' | 'totalWithdrawnKg' | 'totalWithdrawnCones'>,
    userName: string = 'مدير النظام',
    userRole: any = 'admin'
  ): WarehouseStockItem {
    const newItem: WarehouseStockItem = {
      ...itemData,
      id: 'wh-' + Date.now(),
      totalWithdrawnKg: 0,
      totalWithdrawnCones: 0,
      netWeightKg: itemData.totalReceivedKg,
      netCones: itemData.totalReceivedCones,
      lotNumber: itemData.lotNumber || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      warehouseName: itemData.warehouseName || 'مستودع الغزول الرئيسي'
    };

    this.stock.push(newItem);
    this.recalculateInventoryIntegrity();

    // Record initial movement ledger entry if totalReceivedKg > 0
    if (newItem.totalReceivedKg > 0) {
      const movement: InventoryMovement = {
        id: 'mov-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'RECEIPT',
        typeAr: 'إضافة صنف جديد',
        referenceNo: newItem.lotNumber || 'INIT',
        yarnCount: newItem.yarnCount,
        origin: newItem.origin,
        coneLength: newItem.coneLength,
        weightChangeKg: newItem.totalReceivedKg,
        conesChange: newItem.totalReceivedCones,
        runningBalanceKg: newItem.netWeightKg,
        runningBalanceCones: newItem.netCones,
        departmentOrSupplier: 'مدير النظام / إدارة المستودع',
        notes: `إضافة صنف جديد للمستودع (لوط: ${newItem.lotNumber})`,
        operator: userName
      };
      this.movements.unshift(movement);
    }

    this.logAudit(userName, userRole, 'إضافة صنف جديد للمستودع', `تمت إضافة الصنف "${newItem.yarnCount}" (مصدر: ${newItem.origin} | اللوط: ${newItem.lotNumber}) برصيد أولي ${newItem.netWeightKg} كجم`);
    this.save();
    return newItem;
  }

  public updateWarehouseStockItem(
    updatedItem: WarehouseStockItem,
    userName: string = 'مدير النظام',
    userRole: any = 'admin'
  ): void {
    const idx = this.stock.findIndex(s => s.id === updatedItem.id);
    if (idx === -1) {
      throw new Error('الصنف غير موجود في المستودع');
    }

    const oldItem = this.stock[idx];
    this.stock[idx] = {
      ...oldItem,
      ...updatedItem,
      yarnCount: updatedItem.yarnCount.trim(),
      origin: updatedItem.origin,
      coneLength: Number(updatedItem.coneLength),
      lotNumber: updatedItem.lotNumber || oldItem.lotNumber || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      totalReceivedKg: Number(updatedItem.totalReceivedKg),
      totalReceivedCones: Number(updatedItem.totalReceivedCones),
      usage: updatedItem.usage,
      notes: updatedItem.notes,
      minStockKg: Number(updatedItem.minStockKg)
    };

    this.recalculateInventoryIntegrity();
    this.logAudit(userName, userRole, 'تعديل صنف مخزني', `تم تعديل بيانات الصنف "${updatedItem.yarnCount}" (اللوط: ${updatedItem.lotNumber})`);
    this.save();
  }

  public deleteWarehouseStockItem(
    id: string,
    userName: string = 'مدير النظام',
    userRole: any = 'admin'
  ): void {
    const idx = this.stock.findIndex(s => s.id === id);
    if (idx !== -1) {
      const item = this.stock[idx];
      this.stock.splice(idx, 1);
      this.recalculateInventoryIntegrity();
      this.logAudit(userName, userRole, 'حذف صنف من المستودع', `تم حذف الصنف "${item.yarnCount}" (اللوط: ${item.lotNumber || '-'})`);
      this.save();
    }
  }

  public resetToInitialData() {
    this.purchases = INITIAL_PURCHASE_ORDERS;
    this.stock = INITIAL_WAREHOUSE_STOCK;
    this.withdrawals = INITIAL_WITHDRAWALS;
    this.movements = INITIAL_MOVEMENTS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.recalculateInventoryIntegrity();
    this.save();
  }

  /**
   * Import Warehouse Stock items from parsed Excel/CSV file
   */
  public importStockFromExcel(
    importedItems: Partial<WarehouseStockItem>[],
    replaceExisting: boolean = false,
    userName: string = 'مدير النظام',
    userRole: any = 'admin'
  ) {
    const normalize = (str?: string) => (str || '').trim().toLowerCase();

    if (replaceExisting) {
      this.stock = importedItems.map((item, idx) => ({
        id: `wh-imp-${Date.now()}-${idx}`,
        yarnCount: item.yarnCount || 'غزل غير معرف',
        origin: (item.origin as OriginCode) || 'TR',
        coneLength: Number(item.coneLength) || 44000,
        lotNumber: item.lotNumber || `LOT-${idx + 1}`,
        totalReceivedKg: Number(item.totalReceivedKg) || 0,
        totalReceivedCones: Number(item.totalReceivedCones) || 0,
        totalWithdrawnKg: 0,
        totalWithdrawnCones: 0,
        netWeightKg: Number(item.totalReceivedKg) || 0,
        netCones: Number(item.totalReceivedCones) || 0,
        usage: item.usage || 'WEFT GR',
        notes: item.notes || 'مستورد من ملف Excel',
        minStockKg: 1000,
        maxStockKg: 20000,
        warehouseName: 'مستودع الغزول الرئيسي'
      }));
    } else {
      importedItems.forEach((item, idx) => {
        const existingIdx = this.stock.findIndex(
          s => normalize(s.yarnCount) === normalize(item.yarnCount) &&
               normalize(s.origin) === normalize(item.origin) &&
               (normalize(s.lotNumber) === normalize(item.lotNumber) || !item.lotNumber)
        );

        if (existingIdx !== -1) {
          // Update existing stock
          const existing = this.stock[existingIdx];
          existing.totalReceivedKg = Number(item.totalReceivedKg) || existing.totalReceivedKg;
          existing.totalReceivedCones = Number(item.totalReceivedCones) || existing.totalReceivedCones;
          if (item.coneLength) existing.coneLength = Number(item.coneLength);
          if (item.usage) existing.usage = item.usage;
          if (item.lotNumber) existing.lotNumber = item.lotNumber;
        } else {
          // Add new stock
          this.stock.push({
            id: `wh-imp-${Date.now()}-${idx}`,
            yarnCount: item.yarnCount || 'غزل غير معرف',
            origin: (item.origin as OriginCode) || 'TR',
            coneLength: Number(item.coneLength) || 44000,
            lotNumber: item.lotNumber || `LOT-${idx + 1}`,
            totalReceivedKg: Number(item.totalReceivedKg) || 0,
            totalReceivedCones: Number(item.totalReceivedCones) || 0,
            totalWithdrawnKg: 0,
            totalWithdrawnCones: 0,
            netWeightKg: Number(item.totalReceivedKg) || 0,
            netCones: Number(item.totalReceivedCones) || 0,
            usage: item.usage || 'WEFT GR',
            notes: item.notes || 'مستورد من ملف Excel',
            minStockKg: 1000,
            maxStockKg: 20000,
            warehouseName: 'مستودع الغزول الرئيسي'
          });
        }
      });
    }

    this.recalculateInventoryIntegrity();
    this.logAudit(userName, userRole, 'استيراد جرد المستودع من إكسل', `تم استيراد ${importedItems.length} سجل من ملف Excel (${replaceExisting ? 'استبدال كامل' : 'دمج وتحديث'})`);
    this.save();
  }

  /**
   * Import Purchase Orders from parsed Excel/CSV file
   */
  public importPurchasesFromExcel(
    importedOrders: Partial<PurchaseOrderItem>[],
    replaceExisting: boolean = false,
    userName: string = 'مدير النظام',
    userRole: any = 'admin'
  ) {
    const normalize = (str?: string) => (str || '').trim().toLowerCase();

    if (replaceExisting) {
      this.purchases = importedOrders.map((po, idx) => {
        const reqKg = Number(po.totalRequiredWeightKg) || Number(po.receivedWeightKg) || 0;
        const rcvdKg = Number(po.receivedWeightKg) || 0;
        const tol = calculatePOTolerance(reqKg, rcvdKg);

        return {
          id: `po-imp-${Date.now()}-${idx}`,
          poNumber: po.poNumber || `PO-IMP-${idx + 1}`,
          yarnCount: po.yarnCount || 'غزل غير معرف',
          origin: (po.origin as OriginCode) || 'TR',
          coneLength: Number(po.coneLength) || 44000,
          lotNumber: po.lotNumber,
          totalRequiredWeightKg: reqKg,
          receivedWeightKg: rcvdKg,
          pendingWeightKg: tol.pendingWeightKg,
          receivedConesCount: Number(po.receivedConesCount) || 0,
          expectedReadinessDate: po.expectedReadinessDate || 'جرد',
          status: tol.status,
          createdAt: new Date().toISOString().split('T')[0]
        };
      });
    } else {
      importedOrders.forEach((po, idx) => {
        const existingIdx = this.purchases.findIndex(
          p => normalize(p.poNumber) === normalize(po.poNumber) ||
               (normalize(p.yarnCount) === normalize(po.yarnCount) && normalize(p.origin) === normalize(po.origin) && p.expectedReadinessDate === po.expectedReadinessDate)
        );

        if (existingIdx !== -1) {
          const existing = this.purchases[existingIdx];
          existing.receivedWeightKg = Number(po.receivedWeightKg) || existing.receivedWeightKg;
          existing.receivedConesCount = Number(po.receivedConesCount) || existing.receivedConesCount;
          if (po.totalRequiredWeightKg) existing.totalRequiredWeightKg = Number(po.totalRequiredWeightKg);
          if (po.lotNumber) existing.lotNumber = po.lotNumber;

          const tol = calculatePOTolerance(existing.totalRequiredWeightKg, existing.receivedWeightKg);
          existing.pendingWeightKg = tol.pendingWeightKg;
          existing.status = tol.status;
        } else {
          const reqKg = Number(po.totalRequiredWeightKg) || Number(po.receivedWeightKg) || 0;
          const rcvdKg = Number(po.receivedWeightKg) || 0;
          const tol = calculatePOTolerance(reqKg, rcvdKg);

          this.purchases.push({
            id: `po-imp-${Date.now()}-${idx}`,
            poNumber: po.poNumber || `PO-IMP-${idx + 1}`,
            yarnCount: po.yarnCount || 'غزل غير معرف',
            origin: (po.origin as OriginCode) || 'TR',
            coneLength: Number(po.coneLength) || 44000,
            lotNumber: po.lotNumber,
            totalRequiredWeightKg: reqKg,
            receivedWeightKg: rcvdKg,
            pendingWeightKg: tol.pendingWeightKg,
            receivedConesCount: Number(po.receivedConesCount) || 0,
            expectedReadinessDate: po.expectedReadinessDate || 'جرد',
            status: tol.status,
            createdAt: new Date().toISOString().split('T')[0]
          });
        }
      });
    }

    this.recalculateInventoryIntegrity();
    this.logAudit(userName, userRole, 'استيراد طلبات الشراء من إكسل', `تم استيراد ${importedOrders.length} أمر شراء من ملف Excel (${replaceExisting ? 'استبدال كامل' : 'دمج وتحديث'})`);
    this.save();
  }

  /**
   * Wipe all data clean (0 stock, 0 purchases, 0 withdrawals) for fresh start
   */
  public wipeAllDataClean(userName: string = 'مدير النظام', userRole: any = 'admin') {
    localStorage.setItem('yarn_erp_v4_zeroed', 'true');
    this.purchases = [];
    this.stock = [];
    this.withdrawals = [];
    this.movements = [];
    this.notifications = [
      {
        id: `notif-${Date.now()}`,
        title: 'تصفير بيانات النظام بنجاح',
        message: 'تم تصفير النظام بالكامل. جميع المشتريات والمخزون والسحوبات الآن عند الصفر (0)، ويمكنك رفع أوراق الإكسل المحدثة بشكل مستقل لكل قسم.',
        type: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false
      }
    ];
    this.auditLogs = [
      {
        id: `log-${Date.now()}`,
        userName,
        userRole,
        action: 'تصفير شامل للبيانات',
        details: 'تم مسح المخزون وطلبات الشراء وسجل المسحوبات بالكامل للبدء من جديد',
        timestamp: new Date().toISOString()
      }
    ];

    this.save();
  }
}

export const storageService = new StorageService();
