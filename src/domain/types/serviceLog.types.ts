export interface ServiceLog {
  id: string;
  vehicleId: string;
  serviceDate: string;
  serviceKm: number;
  notes: string | null;
  createdAt: string;
  vehicleName: string;
  serviceType: string;
}

export interface CreateServiceLogInput {
  vehicleId: string;
  serviceDate: string;
  serviceKm: number;
  notes?: string;
}
