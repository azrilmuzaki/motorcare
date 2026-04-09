export type VehicleType = 'car' | 'motorcycle' | 'truck';

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  type: VehicleType;
  serviceType: string;
  isActive?: boolean;
  currentKm: number;
  targetInterval: number;
  dailyEst: number;
  createdAt: string;
  updatedAt: string;
  // Computed
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
};

export type ServiceStatus = 'ok' | 'warning' | 'urgent' | 'overdue';
