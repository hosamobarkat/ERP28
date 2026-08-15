/**
 * Business Logic Calculators Layer for Textile Weaving ERP
 * All formulas are dynamic and isolated from UI components for maintenance and upgrades.
 */

export class ProductionCalculator {
  /**
   * Converts Picks per Cm to Picks per Meter
   * 1 meter = 100 cm
   */
  static picksPerMeter(picksPerCm: number): number {
    return Math.max(1, picksPerCm * 100);
  }

  /**
   * Calculates Theoretical Hourly Production in Meters
   * Formula: (RPM * 60) / (Picks per Meter)
   */
  static hourlyTheoreticalMeters(rpm: number, picksPerCm: number): number {
    if (rpm <= 0 || picksPerCm <= 0) return 0;
    const picksPerM = this.picksPerMeter(picksPerCm);
    const metersPerHour = (rpm * 60) / picksPerM;
    return Math.round(metersPerHour * 100) / 100;
  }

  /**
   * Calculates Theoretical Daily Production in Meters
   * Formula: Hourly Theoretical Meters * Daily Operating Hours
   */
  static dailyTheoreticalMeters(
    rpm: number,
    picksPerCm: number,
    dailyOperatingHours: number = 24
  ): number {
    const hourly = this.hourlyTheoreticalMeters(rpm, picksPerCm);
    return Math.round(hourly * dailyOperatingHours * 100) / 100;
  }

  /**
   * Calculates Expected Daily Production considering loom target efficiency %
   * Formula: Daily Theoretical Meters * (Default Efficiency % / 100)
   */
  static expectedDailyMeters(
    rpm: number,
    picksPerCm: number,
    dailyOperatingHours: number = 24,
    efficiencyPercent: number = 85
  ): number {
    const theoretical = this.dailyTheoreticalMeters(rpm, picksPerCm, dailyOperatingHours);
    const expected = theoretical * (efficiencyPercent / 100);
    return Math.round(expected * 100) / 100;
  }

  /**
   * Calculates Theoretical Production for a specific shift or operating hours duration
   */
  static shiftTheoreticalMeters(rpm: number, picksPerCm: number, operatingHours: number): number {
    const hourly = this.hourlyTheoreticalMeters(rpm, picksPerCm);
    return Math.round(hourly * operatingHours * 100) / 100;
  }
}

export class EfficiencyCalculator {
  /**
   * Calculates Efficiency percentage from actual and theoretical production meters
   * Formula: (Actual Meters / Theoretical Meters) * 100
   */
  static calculateEfficiencyPercent(actualMeters: number, theoreticalMeters: number): number {
    if (theoreticalMeters <= 0) return 0;
    const eff = (actualMeters / theoreticalMeters) * 100;
    return Math.min(100, Math.round(eff * 10) / 10);
  }

  /**
   * Calculates Average Efficiency percentage across an array of records
   */
  static calculateAverageEfficiency(
    records: Array<{ actualMeters: number; theoreticalMeters: number }>
  ): number {
    if (!records || records.length === 0) return 0;
    const totalActual = records.reduce((sum, r) => sum + (r.actualMeters || 0), 0);
    const totalTheoretical = records.reduce((sum, r) => sum + (r.theoreticalMeters || 0), 0);
    return this.calculateEfficiencyPercent(totalActual, totalTheoretical);
  }
}

export class OrderCompletionCalculator {
  /**
   * Calculates Order Progress, remaining meters, remaining days and estimated completion date
   */
  static calculateOrderStatus(
    requiredQuantityMeters: number,
    producedQuantityMeters: number,
    assignedLoomsDailyExpectedMeters: number,
    targetDeliveryDate?: string
  ): {
    remainingMeters: number;
    completionPercent: number;
    remainingDays: number;
    estimatedCompletionDate: string;
    isDelayed: boolean;
  } {
    const remainingMeters = Math.max(0, requiredQuantityMeters - producedQuantityMeters);
    const completionPercent =
      requiredQuantityMeters > 0
        ? Math.min(100, Math.round((producedQuantityMeters / requiredQuantityMeters) * 1000) / 10)
        : 0;

    let remainingDays = 0;
    if (remainingMeters > 0 && assignedLoomsDailyExpectedMeters > 0) {
      remainingDays = Math.ceil(remainingMeters / assignedLoomsDailyExpectedMeters);
    }

    const today = new Date();
    const estDate = new Date();
    estDate.setDate(today.getDate() + remainingDays);
    const estimatedCompletionDate = estDate.toISOString().split('T')[0];

    let isDelayed = false;
    if (targetDeliveryDate && remainingMeters > 0) {
      const targetDate = new Date(targetDeliveryDate);
      isDelayed = estDate > targetDate;
    }

    return {
      remainingMeters,
      completionPercent,
      remainingDays,
      estimatedCompletionDate,
      isDelayed,
    };
  }
}

export class LoomCapacityCalculator {
  /**
   * Calculates aggregate capacity for a group or hall of looms
   */
  static calculateAggregateDailyCapacity(
    looms: Array<{ rpm: number; picksPerCm: number; dailyOperatingHours: number; defaultEfficiencyPercent: number }>
  ): {
    totalTheoreticalDailyMeters: number;
    totalExpectedDailyMeters: number;
  } {
    let totalTheoreticalDailyMeters = 0;
    let totalExpectedDailyMeters = 0;

    for (const loom of looms) {
      const theoretical = ProductionCalculator.dailyTheoreticalMeters(
        loom.rpm,
        loom.picksPerCm,
        loom.dailyOperatingHours
      );
      const expected = ProductionCalculator.expectedDailyMeters(
        loom.rpm,
        loom.picksPerCm,
        loom.dailyOperatingHours,
        loom.defaultEfficiencyPercent
      );

      totalTheoreticalDailyMeters += theoretical;
      totalExpectedDailyMeters += expected;
    }

    return {
      totalTheoreticalDailyMeters: Math.round(totalTheoreticalDailyMeters),
      totalExpectedDailyMeters: Math.round(totalExpectedDailyMeters),
    };
  }
}

export class DowntimeCalculator {
  /**
   * Converts start and end time (HH:mm) to duration in minutes
   */
  static calculateDurationMinutes(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    let startMin = h1 * 60 + m1;
    let endMin = h2 * 60 + m2;
    if (endMin < startMin) {
      endMin += 24 * 60; // Next day wrap
    }
    return Math.max(0, endMin - startMin);
  }

  /**
   * Group downtime by reason with total minutes and percentage
   */
  static summarizeByReason(
    stoppages: Array<{ reason: string; durationMinutes: number }>
  ): Array<{ reason: string; totalMinutes: number; percentage: number }> {
    const totalAll = stoppages.reduce((acc, s) => acc + s.durationMinutes, 0);
    const map = new Map<string, number>();

    stoppages.forEach((s) => {
      map.set(s.reason, (map.get(s.reason) || 0) + s.durationMinutes);
    });

    const result: Array<{ reason: string; totalMinutes: number; percentage: number }> = [];
    map.forEach((totalMinutes, reason) => {
      const percentage = totalAll > 0 ? Math.round((totalMinutes / totalAll) * 1000) / 10 : 0;
      result.push({ reason, totalMinutes, percentage });
    });

    return result.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }
}
