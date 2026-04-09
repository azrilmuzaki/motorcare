import type { Vehicle } from '@domain/types/vehicle.types';

export const getVehicleDisplayName = (
  vehicle: Pick<Vehicle, 'name'>,
): string => vehicle.name.trim();

export const getVehicleUsageEstimate = (
  vehicle: Pick<Vehicle, 'dailyEst'>,
): string => `${vehicle.dailyEst.toLocaleString('id-ID')} km/hari`;

export const getVehicleRemainingKmLabel = (
  vehicle: Pick<Vehicle, 'remainingKm'>,
): string => `${(vehicle.remainingKm ?? 0).toLocaleString('id-ID')} km`;
