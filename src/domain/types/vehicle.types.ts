export type VehicleType = 'car' | 'motorcycle' | 'truck';

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  type: VehicleType;
  serviceType: string;
  isActive?: boolean;
  currentKm: number;
  serviceStartKm: number;
  targetInterval: number;
  dailyEst: number;
  createdAt: string;
  updatedAt: string;
  lastOdometerUpdateAt: string;
  // Computed
  projectedCurrentKm?: number;
  remainingKm?: number;
  estimatedDays?: number;
}

export interface CreateVehicleInput {
  name: string;
  type: VehicleType;
  serviceType: string;
  currentKm: number;
  targetInterval: number;
  dailyEst: number;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput> & {
  isActive?: boolean;
  serviceStartKm?: number;
  lastOdometerUpdateAt?: string;
};

export type ServiceStatus = 'ok' | 'warning' | 'urgent' | 'overdue';
