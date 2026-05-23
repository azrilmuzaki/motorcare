import { Vehicle, ServiceStatus, VehicleComponent } from '@domain/types/vehicle.types';
import {
  SERVICE_THRESHOLD,
} from '@core/constants/app.constants';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDate(value: string | Date | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Hitung jumlah hari penggunaan sejak update odometer terakhir.
 */
export function calculateElapsedUsageDays(
  referenceDate: string | Date,
  now: Date = new Date(),
): number {
  const parsedReference = parseDate(referenceDate);

  if (!parsedReference) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((now.getTime() - parsedReference.getTime()) / MS_PER_DAY),
  );
}

/**
 * Proyeksikan KM saat ini berdasarkan estimasi pemakaian harian.
 */
export function calculateProjectedCurrentKm(
  currentKm: number,
  dailyEst: number,
  referenceDate: string | Date,
  now: Date = new Date(),
): number {
  if (dailyEst <= 0) {
    return currentKm;
  }

  const elapsedDays = calculateElapsedUsageDays(referenceDate, now);
  return currentKm + elapsedDays * dailyEst;
}

/**
 * Hitung sisa KM hingga jadwal servis berikutnya.
 * Siklus servis dimulai dari KM saat kendaraan terakhir dicatat/diservis.
 */
export function calculateRemainingKm(
  projectedCurrentKm: number,
  serviceStartKm: number,
  targetInterval: number,
): number {
  if (targetInterval <= 0) {
    return 0;
  }

  const kmSinceServiceStart = Math.max(0, projectedCurrentKm - serviceStartKm);
  return targetInterval - kmSinceServiceStart;
}

/**
 * Estimasi hari menuju servis
 * estimatedDays = remainingKm / daily_est
 */
export function calculateEstimatedDays(
  remainingKm: number,
  dailyEst: number
): number {
  if (dailyEst <= 0 || remainingKm <= 0) return 0;
  return Math.ceil(remainingKm / dailyEst);
}

/**
 * Persentase sisa progress servis.
 * Nilai akan mengecil saat kendaraan mendekati jadwal servis.
 */
export function calculateServiceProgressPercent(
  remainingKm: number,
  targetInterval: number,
): number {
  if (targetInterval <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (Math.max(remainingKm, 0) / targetInterval) * 100));
}

/**
 * Tentukan status servis berdasarkan sisa KM
 */
export function getServiceStatus(remainingKm: number): ServiceStatus {
  if (remainingKm <= 0) return 'overdue';
  if (remainingKm <= SERVICE_THRESHOLD.URGENT) return 'urgent';
  if (remainingKm <= SERVICE_THRESHOLD.WARNING) return 'warning';
  return 'ok';
}

/**
 * Enrich vehicle dengan computed fields
 */
export function enrichVehicle(vehicle: Vehicle, now: Date = new Date()): Vehicle {
  const kmReferenceDate =
    vehicle.lastOdometerUpdateAt ||
    vehicle.updatedAt ||
    vehicle.createdAt;
  const serviceStartKm = vehicle.serviceStartKm ?? vehicle.currentKm;
  const projectedCurrentKm = calculateProjectedCurrentKm(
    vehicle.currentKm,
    vehicle.dailyEst,
    kmReferenceDate,
    now,
  );
  const remainingKm = calculateRemainingKm(
    projectedCurrentKm,
    serviceStartKm,
    vehicle.targetInterval,
  );
  const estimatedDays = calculateEstimatedDays(remainingKm, vehicle.dailyEst);

  return {
    ...vehicle,
    serviceStartKm,
    lastOdometerUpdateAt: kmReferenceDate,
    projectedCurrentKm,
    remainingKm,
    estimatedDays,
  };
}

/**
 * Hitung tanggal estimasi servis berikutnya
 */
export function calculateNextServiceDate(
  estimatedDays: number
): Date {
  const date = new Date();
  date.setDate(date.getDate() + estimatedDays);
  return date;
}

/**
 * Enrich component dengan computed fields (remainingKm, estimatedDays)
 */
export function enrichComponent(
  component: VehicleComponent,
  projectedCurrentKm: number,
  dailyEst: number
): VehicleComponent {
  const remainingKm = calculateRemainingKm(
    projectedCurrentKm,
    component.lastServiceKm,
    component.targetInterval,
  );
  const estimatedDays = calculateEstimatedDays(remainingKm, dailyEst);

  return {
    ...component,
    remainingKm,
    estimatedDays,
  };
}
