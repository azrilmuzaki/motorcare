import { Vehicle, ServiceStatus } from '@domain/types/vehicle.types';
import {
  SERVICE_THRESHOLD,
} from '@core/constants/app.constants';

/**
 * Hitung sisa KM hingga jadwal servis
 * remainingKm = target_interval - (current_km % target_interval)
 */
export function calculateRemainingKm(
  currentKm: number,
  targetInterval: number
): number {
  const kmSinceLastService = currentKm % targetInterval;
  return targetInterval - kmSinceLastService;
}

/**
 * Estimasi hari menuju servis
 * estimatedDays = remainingKm / daily_est
 */
export function calculateEstimatedDays(
  remainingKm: number,
  dailyEst: number
): number {
  if (dailyEst <= 0) return 0;
  return Math.floor(remainingKm / dailyEst);
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
export function enrichVehicle(vehicle: Vehicle): Vehicle {
  const remainingKm = calculateRemainingKm(
    vehicle.currentKm,
    vehicle.targetInterval
  );
  const estimatedDays = calculateEstimatedDays(remainingKm, vehicle.dailyEst);

  return {
    ...vehicle,
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