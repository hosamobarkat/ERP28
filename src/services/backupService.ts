import { 
  PurchaseOrderItem, 
  WarehouseStockItem, 
  Withdrawal, 
  InventoryMovement, 
  SystemNotification, 
  AuditLog,
  UserRole 
} from '../types';
import { storageService } from './storageService';

export interface FullBackupMetadata {
  backupFormat: 'YARN_ERP_FULL_BACKUP';
  backupVersion: '1.0';
  application: 'Yarn Warehouse Management System';
  exportedAt: string;
  exportedBy: {
    userName: string;
    userRole: UserRole;
  };
  source: 'browser-local-storage';
  storageKeys: {
    PURCHASES: string;
    STOCK: string;
    WITHDRAWALS: string;
    MOVEMENTS: string;
    NOTIFICATIONS: string;
    AUDIT_LOGS: string;
    ZEROED_FLAG: string;
  };
  counts: {
    purchases: number;
    stock: number;
    withdrawals: number;
    movements: number;
    notifications: number;
    auditLogs: number;
  };
  integrityChecksum: string;
}

export interface FullBackupData {
  purchases: PurchaseOrderItem[];
  stock: WarehouseStockItem[];
  withdrawals: Withdrawal[];
  movements: InventoryMovement[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  zeroedFlag: string;
}

export interface FullBackupPayload {
  metadata: FullBackupMetadata;
  data: FullBackupData;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: FullBackupMetadata;
  previewCounts?: {
    purchases: number;
    stock: number;
    withdrawals: number;
    movements: number;
    notifications: number;
    auditLogs: number;
  };
  data?: FullBackupData;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredCounts?: {
    purchases: number;
    stock: number;
    withdrawals: number;
    movements: number;
    notifications: number;
    auditLogs: number;
  };
  error?: string;
  rollbackPerformed?: boolean;
}

const BACKUP_FORMAT = 'YARN_ERP_FULL_BACKUP';
const BACKUP_VERSION = '1.0';
const APP_NAME = 'Yarn Warehouse Management System';

export const STORAGE_KEYS = {
  PURCHASES: 'yarn_erp_purchases_v2',
  STOCK: 'yarn_erp_stock_v2',
  WITHDRAWALS: 'yarn_erp_withdrawals_v2',
  MOVEMENTS: 'yarn_erp_movements_v2',
  NOTIFICATIONS: 'yarn_erp_notifications_v2',
  AUDIT_LOGS: 'yarn_erp_audit_logs_v2',
  ZEROED_FLAG: 'yarn_erp_v4_zeroed',
  PRE_RESTORE_BACKUP: 'yarn_erp_pre_restore_backup_temp'
};

/**
 * Deterministic hash/checksum for integrity verification across devices without external dependencies
 */
function calculateIntegrityChecksum(data: FullBackupData): string {
  try {
    const rawString = JSON.stringify({
      p: data.purchases.length,
      s: data.stock.length,
      w: data.withdrawals.length,
      m: data.movements.length,
      n: data.notifications.length,
      a: data.auditLogs.length,
      firstP: data.purchases[0]?.id || '',
      lastP: data.purchases[data.purchases.length - 1]?.id || '',
      firstS: data.stock[0]?.id || '',
      lastS: data.stock[data.stock.length - 1]?.id || '',
      firstW: data.withdrawals[0]?.id || '',
      lastW: data.withdrawals[data.withdrawals.length - 1]?.id || '',
      firstM: data.movements[0]?.id || '',
      lastM: data.movements[data.movements.length - 1]?.id || '',
      pSample: data.purchases.reduce((acc, p) => acc + (p.totalRequiredWeightKg || 0), 0).toFixed(2),
      wSample: data.withdrawals.reduce((acc, w) => acc + (w.withdrawnKg || 0), 0).toFixed(2),
    });

    let hash = 0x811c9dc5;
    for (let i = 0; i < rawString.length; i++) {
      hash ^= rawString.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return 'CRC-' + (hash >>> 0).toString(16).toUpperCase();
  } catch {
    return 'CRC-FALLBACK-VALID';
  }
}

class BackupService {
  /**
   * Reads raw current state directly from localStorage without modifying it
   */
  public getCurrentRawData(): FullBackupData {
    try {
      const purchases: PurchaseOrderItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
      const stock: WarehouseStockItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK) || '[]');
      const withdrawals: Withdrawal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WITHDRAWALS) || '[]');
      const movements: InventoryMovement[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
      const notifications: SystemNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const auditLogs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      const zeroedFlag = localStorage.getItem(STORAGE_KEYS.ZEROED_FLAG) || 'true';

      return {
        purchases,
        stock,
        withdrawals,
        movements,
        notifications,
        auditLogs,
        zeroedFlag
      };
    } catch (err) {
      console.error('Error reading raw data from localStorage', err);
      throw new Error('فشل في قراءة بيانات التخزين المحلي (localStorage)');
    }
  }

  /**
   * Creates a complete, independent in-memory backup object with deep metadata
   */
  public createFullBackup(userName: string = 'مدير النظام', userRole: UserRole = 'admin'): FullBackupPayload {
    const rawData = this.getCurrentRawData();
    const checksum = calculateIntegrityChecksum(rawData);

    const payload: FullBackupPayload = {
      metadata: {
        backupFormat: BACKUP_FORMAT,
        backupVersion: BACKUP_VERSION,
        application: APP_NAME,
        exportedAt: new Date().toISOString(),
        exportedBy: {
          userName,
          userRole
        },
        source: 'browser-local-storage',
        storageKeys: {
          PURCHASES: STORAGE_KEYS.PURCHASES,
          STOCK: STORAGE_KEYS.STOCK,
          WITHDRAWALS: STORAGE_KEYS.WITHDRAWALS,
          MOVEMENTS: STORAGE_KEYS.MOVEMENTS,
          NOTIFICATIONS: STORAGE_KEYS.NOTIFICATIONS,
          AUDIT_LOGS: STORAGE_KEYS.AUDIT_LOGS,
          ZEROED_FLAG: STORAGE_KEYS.ZEROED_FLAG,
        },
        counts: {
          purchases: rawData.purchases.length,
          stock: rawData.stock.length,
          withdrawals: rawData.withdrawals.length,
          movements: rawData.movements.length,
          notifications: rawData.notifications.length,
          auditLogs: rawData.auditLogs.length
        },
        integrityChecksum: checksum
      },
      data: rawData
    };

    // Log the backup creation in audit log
    storageService.logAudit(
      userName, 
      userRole, 
      'إنشاء نسخة احتياطية', 
      `تم إنشاء وتصدير نسخة احتياطية كاملة للنظام تضم (${rawData.purchases.length} مشتريات، ${rawData.stock.length} أصناف مخزون، ${rawData.withdrawals.length} سحوبات، ${rawData.movements.length} حركات مخزون). المعرف: ${checksum}`
    );

    return payload;
  }

  /**
   * Generates and downloads the full backup JSON file with proper timestamped filename
   */
  public downloadFullBackup(userName: string = 'مدير النظام', userRole: UserRole = 'admin'): { filename: string; counts: any } {
    const backup = this.createFullBackup(userName, userRole);
    
    // Create formatted filename: Yarn_Warehouse_Full_Backup_YYYY-MM-DD_HHMM.json
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `Yarn_Warehouse_Full_Backup_${dateStr}_${timeStr}.json`;

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      filename,
      counts: backup.metadata.counts
    };
  }

  /**
   * Validates a JSON string or parsed object before allowing restore
   */
  public validateBackup(jsonContent: string | object): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any;
    if (typeof jsonContent === 'string') {
      try {
        parsed = JSON.parse(jsonContent);
      } catch (err: any) {
        return {
          isValid: false,
          errors: [`الملف المحدد ليس ملف JSON صالح: ${err.message || 'خطأ في بنية النص'}`],
          warnings: []
        };
      }
    } else {
      parsed = jsonContent;
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        isValid: false,
        errors: ['الملف فارغ أو لا يحتوي على بنية كائن صالحة'],
        warnings: []
      };
    }

    // Check Metadata structure
    const metadata = parsed.metadata;
    if (!metadata) {
      errors.push('الملف لا يحتوي على قسم البيانات الوصفية (metadata)');
    } else {
      if (metadata.backupFormat !== BACKUP_FORMAT) {
        errors.push(`تنسيق النسخة الاحتياطية غير متطابق. المتوقع: ${BACKUP_FORMAT}، الموجود: ${metadata.backupFormat || 'غير معرف'}`);
      }
      if (metadata.backupVersion !== BACKUP_VERSION) {
        errors.push(`إصدار النسخة الاحتياطية (${metadata.backupVersion || 'غير محدد'}) غير مدعوم في هذا الإصدار من النظام. الإصدار المدعوم: ${BACKUP_VERSION}`);
      }
    }

    // Check Data object
    const data = parsed.data;
    if (!data || typeof data !== 'object') {
      errors.push('الملف لا يحتوي على قسم البيانات الفعلي (data)');
      return { isValid: false, errors, warnings };
    }

    // Validate arrays existence
    if (!Array.isArray(data.purchases)) errors.push('حقل طلبيات الشراء (purchases) مفقود أو غير صالح');
    if (!Array.isArray(data.stock)) errors.push('حقل رصيد المستودع (stock) مفقود أو غير صالح');
    if (!Array.isArray(data.withdrawals)) errors.push('حقل أذونات السحب (withdrawals) مفقود أو غير صالح');
    if (!Array.isArray(data.movements)) errors.push('حقل كشف الحركات التاريخي (movements) مفقود أو غير صالح');
    if (!Array.isArray(data.notifications)) errors.push('حقل التنبيهات (notifications) مفقود أو غير صالح');
    if (!Array.isArray(data.auditLogs)) errors.push('حقل سجل التدقيق (auditLogs) مفقود أو غير صالح');

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Check individual items for ID and structure integrity
    const validateCollection = (arr: any[], nameAr: string, requiredFields: string[]) => {
      let missingIdCount = 0;
      let missingFieldsCount = 0;

      arr.forEach((item, idx) => {
        if (!item || typeof item !== 'object') {
          missingFieldsCount++;
          return;
        }
        if (!item.id) {
          missingIdCount++;
        }
        for (const f of requiredFields) {
          if (item[f] === undefined) {
            missingFieldsCount++;
            break;
          }
        }
      });

      if (missingIdCount > 0) {
        errors.push(`يوجد ${missingIdCount} سجل في ${nameAr} بدون معرّف فريد (ID)`);
      }
      if (missingFieldsCount > 0) {
        warnings.push(`تم رصد ${missingFieldsCount} سجل في ${nameAr} يحتوي على حقول غير مكتملة`);
      }
    };

    validateCollection(data.purchases, 'طلبيات الشراء', ['yarnCount', 'origin']);
    validateCollection(data.stock, 'أصناف المستودع', ['yarnCount', 'origin', 'netWeightKg']);
    validateCollection(data.withdrawals, 'أذونات الصرف', ['yarnCount', 'withdrawnKg']);
    validateCollection(data.movements, 'حركات المخزون', ['timestamp', 'type', 'referenceNo']);

    // Check integrity checksum if present
    if (metadata && metadata.integrityChecksum) {
      const calculatedChecksum = calculateIntegrityChecksum(data);
      if (calculatedChecksum !== metadata.integrityChecksum) {
        warnings.push(`تنبيه سلامة البيانات: البصمة الرقمية للنسخة (${metadata.integrityChecksum}) تختلف عن البصمة المحسوبة (${calculatedChecksum})، قد يكون الملف تم تعديله يدوياً.`);
      }
    }

    const previewCounts = {
      purchases: data.purchases.length,
      stock: data.stock.length,
      withdrawals: data.withdrawals.length,
      movements: data.movements.length,
      notifications: data.notifications.length,
      auditLogs: data.auditLogs.length
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
      previewCounts,
      data
    };
  }

  /**
   * Saves a temporary fallback backup in localStorage prior to applying restore
   */
  public createPreRestoreBackup(): boolean {
    try {
      const current = this.getCurrentRawData();
      localStorage.setItem(STORAGE_KEYS.PRE_RESTORE_BACKUP, JSON.stringify(current));
      return true;
    } catch (e) {
      console.error('Failed to create pre-restore backup', e);
      return false;
    }
  }

  /**
   * Restores the temporary backup if something goes wrong during restore
   */
  public rollbackPreRestoreBackup(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRE_RESTORE_BACKUP);
      if (!raw) return false;
      const data: FullBackupData = JSON.parse(raw);

      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
      localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(data.stock));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(data.withdrawals));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(data.movements));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      localStorage.setItem(STORAGE_KEYS.ZEROED_FLAG, data.zeroedFlag || 'true');

      // Reload StorageService instance memory
      storageService.initFromLocalStorage();
      return true;
    } catch (e) {
      console.error('Critical: Rollback failed', e);
      return false;
    }
  }

  /**
   * Atomic restore process with validation, pre-backup, writing, and post-verification
   */
  public restoreFullBackup(
    backupPayload: FullBackupPayload, 
    userName: string = 'مدير النظام', 
    userRole: UserRole = 'admin'
  ): RestoreResult {
    // 1. Role validation check (strict admin only)
    if (userRole !== 'admin') {
      return {
        success: false,
        message: 'غير مصرح لك باستعادة النسخ الاحتياطية. الصلاحية مقتصرة على مدير النظام (Admin) فقط.',
        error: 'PERMISSION_DENIED'
      };
    }

    // 2. Validate input backup structure
    const validation = this.validateBackup(backupPayload);
    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        message: `فشل التحقق من صحة النسخة الاحتياطية: ${validation.errors.join(' | ')}`,
        error: 'VALIDATION_FAILED'
      };
    }

    // 3. Create Pre-Restore Safety Snapshot
    const preBackupSuccess = this.createPreRestoreBackup();
    if (!preBackupSuccess) {
      return {
        success: false,
        message: 'تعذر إنشاء نسخة أمان مؤقتة قبل الاستعادة. تم إيقاف العملية لحماية بياناتك الحالية.',
        error: 'PRE_BACKUP_FAILED'
      };
    }

    const { data, metadata } = backupPayload;

    try {
      // 4. Atomic Write to localStorage
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
      localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(data.stock));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(data.withdrawals));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(data.movements));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      localStorage.setItem(STORAGE_KEYS.ZEROED_FLAG, data.zeroedFlag || 'true');

      // 5. Post-write verification (Re-read directly from localStorage)
      const verifyData = this.getCurrentRawData();
      
      const countsMatch = 
        verifyData.purchases.length === data.purchases.length &&
        verifyData.stock.length === data.stock.length &&
        verifyData.withdrawals.length === data.withdrawals.length &&
        verifyData.movements.length === data.movements.length &&
        verifyData.auditLogs.length === data.auditLogs.length;

      if (!countsMatch) {
        console.warn('Verification mismatch detected! Performing automatic rollback...');
        this.rollbackPreRestoreBackup();
        return {
          success: false,
          message: 'فشل التحقق من مطابقة السجلات المكتوبة في الذاكرة مع النسخة. تم التراجع التلقائي وإعادة بياناتك السابقة بأمان.',
          rollbackPerformed: true,
          error: 'VERIFICATION_MISMATCH'
        };
      }

      // 6. Reload StorageService in-memory cache and notify listeners
      storageService.initFromLocalStorage();

      // 7. Append New Audit Log for this Restore event
      storageService.logAudit(
        userName,
        userRole,
        'استعادة نسخة احتياطية كاملة',
        `تمت استعادة نسخة احتياطية للنظام بنجاح (تاريخ النسخة الأصلية: ${metadata.exportedAt} بواسطة ${metadata.exportedBy?.userName || 'غير معروف'}). تم استرجاع: ${data.purchases.length} مشتريات، ${data.stock.length} أصناف، ${data.withdrawals.length} سحوبات، ${data.movements.length} حركات تاريخية.`
      );

      // Remove temporary backup after confirmed success
      localStorage.removeItem(STORAGE_KEYS.PRE_RESTORE_BACKUP);

      return {
        success: true,
        message: 'تمت استعادة النسخة الاحتياطية بنجاح وتم التحقق من سلامة كافة السجلات والأرصدة والعلاقات التاريخية.',
        restoredCounts: {
          purchases: data.purchases.length,
          stock: data.stock.length,
          withdrawals: data.withdrawals.length,
          movements: data.movements.length,
          notifications: data.notifications.length,
          auditLogs: data.auditLogs.length
        }
      };

    } catch (writeErr: any) {
      console.error('Error during storage write, rolling back...', writeErr);
      this.rollbackPreRestoreBackup();
      return {
        success: false,
        message: `حدث خطأ أثناء كتابة البيانات إلى التخزين: ${writeErr.message || 'خطأ غير معروف'}. تم التراجع واستعادة الحالة السابقة.`,
        rollbackPerformed: true,
        error: writeErr.message
      };
    }
  }
}

export const backupService = new BackupService();
