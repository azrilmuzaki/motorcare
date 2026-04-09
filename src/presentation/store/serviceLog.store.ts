import { create } from 'zustand';
import { ServiceLogService } from '@data/services/serviceLog.service';
import { ServiceLog, CreateServiceLogInput } from '@domain/types/serviceLog.types';
import i18n from '../../../i18n';

interface ServiceLogStore {
  logs: ServiceLog[];
  isLoading: boolean;
  error: string | null;

  fetchLogs: (userId: string) => Promise<void>;
  addLog: (input: CreateServiceLogInput) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useServiceLogStore = create<ServiceLogStore>((set) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await ServiceLogService.getServiceLogs(userId);
      set({ logs, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.historyLoadFailed');
      set({ error: message, isLoading: false });
    }
  },

  addLog: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const log = await ServiceLogService.createServiceLog(input);
      set((state) => ({
        logs: [log, ...state.logs],
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.historyAddFailed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteLog: async (id) => {
    const prev = useServiceLogStore.getState().logs;
    set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
    try {
      await ServiceLogService.deleteServiceLog(id);
    } catch {
      set({ logs: prev });
    }
  },

  clearError: () => set({ error: null }),
}));
