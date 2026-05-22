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
import { useServiceLogStore } from './serviceLog.store';

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
  updateVehicle: (id: string, input: UpdateVehicleInput) => Promise<Vehicle>;
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
      const vehicles = raw.map(vehicle => enrichVehicle(vehicle));
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
      useServiceLogStore.getState().setLogs(history);
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
    const projectedVehicle = vehicle ? enrichVehicle(vehicle) : null;

    if (!projectedVehicle) {
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
        vehicleId: projectedVehicle.id,
        serviceDate,
        serviceKm: projectedVehicle.projectedCurrentKm ?? projectedVehicle.currentKm,
        notes: `Servis diselesaikan: ${projectedVehicle.serviceType}`,
      });

      try {
        await VehicleService.updateVehicle(projectedVehicle.id, { isActive: false });
      } catch (archiveError) {
        await ServiceLogService.deleteServiceLog(createdLog.id).catch(() => undefined);
        throw archiveError;
      }

      const syncedLog = {
        ...createdLog,
        vehicleName: createdLog.vehicleName || projectedVehicle.name,
        serviceType: createdLog.serviceType || projectedVehicle.serviceType,
      };

      useServiceLogStore.getState().prependLog(syncedLog);

      set((state) => ({
        vehicles: state.vehicles.filter(item => item.id !== vehicleId),
        serviceHistory: [
          syncedLog,
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
    const nextHistory = previousHistory.filter(log => log.id !== id);

    useServiceLogStore.getState().setLogs(nextHistory);
    set({ serviceHistory: nextHistory, error: null });

    try {
      await ServiceLogService.deleteServiceLog(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.historyDeleteFailed');
      useServiceLogStore.getState().setLogs(previousHistory);
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
      return enriched;
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
