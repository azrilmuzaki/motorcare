import { create } from 'zustand';
import { ServiceLogService } from '@data/services/serviceLog.service';
import { VehicleService } from '@data/services/vehicle.service';
import {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
} from '@domain/types/vehicle.types';
import { enrichVehicle } from '@domain/logic/vehicle.logic';
import { ServiceLog } from '@domain/types/serviceLog.types';
import i18n from '../../../i18n';

interface VehicleStore {
  vehicles: Vehicle[];
  serviceHistory: ServiceLog[];
  selectedVehicle: Vehicle | null;
  isLoading: boolean;
  markingVehicleId: string | null;
  error: string | null;
  successMessage: string | null;

  fetchVehicles: (userId: string) => Promise<void>;
  fetchServiceHistory: (userId: string) => Promise<void>;
  addVehicle: (userId: string, input: CreateVehicleInput) => Promise<void>;
  markAsServiced: (vehicleId: string) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  updateVehicle: (id: string, input: UpdateVehicleInput) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  serviceHistory: [],
  selectedVehicle: null,
  isLoading: false,
  markingVehicleId: null,
  error: null,
  successMessage: null,

  fetchVehicles: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const raw = await VehicleService.getVehicles(userId);
      // Enrich setiap kendaraan dengan computed fields
      const vehicles = raw.map(enrichVehicle);
      set({ vehicles, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.vehiclesLoadFailed');
      set({ error: message, isLoading: false });
    }
  },

  fetchServiceHistory: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const history = await ServiceLogService.getServiceLogs(userId);
      set({ serviceHistory: history, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.serviceHistoryLoadFailed');
      set({ error: message, isLoading: false });
    }
  },

  addVehicle: async (userId, input) => {
    set({ isLoading: true, error: null });
    try {
      const created = await VehicleService.createVehicle(userId, {
        ...input,
        serviceType: input.serviceType.trim(),
      });
      const enriched = enrichVehicle(created);
      set((state) => ({
        vehicles: [enriched, ...state.vehicles],
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.vehicleAddFailed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  markAsServiced: async (vehicleId) => {
    const vehicle = get().vehicles.find(item => item.id === vehicleId);

    if (!vehicle) {
      const message = i18n.t('messages.vehicleNotFound');
      set({ error: message });
      throw new Error(message);
    }

    set({
      isLoading: true,
      markingVehicleId: vehicleId,
      error: null,
      successMessage: null,
    });

    const serviceDate = new Date().toISOString();

    try {
      const createdLog = await ServiceLogService.createServiceLog({
        vehicleId: vehicle.id,
        serviceDate,
        serviceKm: vehicle.currentKm,
        notes: `Servis diselesaikan: ${vehicle.serviceType}`,
      });

      try {
        await VehicleService.updateVehicle(vehicle.id, { isActive: false });
      } catch (archiveError) {
        await ServiceLogService.deleteServiceLog(createdLog.id).catch(() => undefined);
        throw archiveError;
      }

      set((state) => ({
        vehicles: state.vehicles.filter(item => item.id !== vehicleId),
        serviceHistory: [
          {
            ...createdLog,
            vehicleName: createdLog.vehicleName || vehicle.name,
            serviceType: createdLog.serviceType || vehicle.serviceType,
          },
          ...state.serviceHistory,
        ],
        isLoading: false,
        markingVehicleId: null,
        successMessage: i18n.t('messages.serviceSaved'),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.serviceHistorySaveFailed');
      set({
        error: message,
        isLoading: false,
        markingVehicleId: null,
      });
      throw err;
    }
  },

  removeHistory: async (id) => {
    const previousHistory = get().serviceHistory;

    set((state) => ({
      serviceHistory: state.serviceHistory.filter(log => log.id !== id),
      error: null,
    }));

    try {
      await ServiceLogService.deleteServiceLog(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.historyDeleteFailed');
      set({
        serviceHistory: previousHistory,
        error: message,
      });
      throw err;
    }
  },

  updateVehicle: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await VehicleService.updateVehicle(id, {
        ...input,
        serviceType: input.serviceType?.trim(),
      });
      const enriched = enrichVehicle(updated);
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === id ? enriched : v)),
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.vehicleUpdateFailed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteVehicle: async (id) => {
    // Optimistic delete
    const prev = get().vehicles;
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    }));
    try {
      await VehicleService.deleteVehicle(id);
    } catch (err) {
      // Rollback
      set({ vehicles: prev });
      throw err;
    }
  },

  selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  clearError: () => set({ error: null }),
  clearSuccessMessage: () => set({ successMessage: null }),
}));
