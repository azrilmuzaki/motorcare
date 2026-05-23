import { create } from 'zustand';
import { ComponentService } from '@data/services/component.service';
import type { VehicleComponent, CreateComponentInput, UpdateComponentInput } from '@domain/types/vehicle.types';

interface ComponentState {
  components: VehicleComponent[];
  isLoading: boolean;
  error: string | null;
  loadComponents: (vehicleId: string) => Promise<void>;
  addComponent: (input: CreateComponentInput) => Promise<void>;
  updateComponent: (id: string, input: UpdateComponentInput) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useComponentStore = create<ComponentState>((set) => ({
  components: [],
  isLoading: false,
  error: null,

  loadComponents: async (vehicleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const components = await ComponentService.getComponentsByVehicleId(vehicleId);
      set({ components, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addComponent: async (input: CreateComponentInput) => {
    set({ isLoading: true, error: null });
    try {
      const newComponent = await ComponentService.addComponent(input);
      set(state => ({
        components: [newComponent, ...state.components],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateComponent: async (id: string, input: UpdateComponentInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedComponent = await ComponentService.updateComponent(id, input);
      set(state => ({
        components: state.components.map(c => (c.id === id ? updatedComponent : c)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteComponent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await ComponentService.deleteComponent(id);
      set(state => ({
        components: state.components.filter(c => c.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
