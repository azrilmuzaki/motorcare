import { create } from 'zustand';
import { AuthService } from '@data/services/auth.service';
import { User, LoginCredentials, RegisterCredentials } from '@domain/types/auth.types';
import i18n from '../../../i18n';
import { useSettingsStore } from './settings.store';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await AuthService.login(credentials);
      if (!user) throw new Error(i18n.t('messages.loginFailed'));

      const profile = await AuthService.getUserProfile(user.id);
      set({ user: profile, isAuthenticated: true, isLoading: false });
      await useSettingsStore.getState().loadProfileImage(profile.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.unexpectedError');
      set({ error: message, isLoading: false });
      throw err; // re-throw so UI can catch
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      await AuthService.register(credentials);
      // Profile akan dibuat oleh trigger DB, login setelah register
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18n.t('messages.registerFailed');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      useSettingsStore.getState().clearProfileImageState();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const session = await AuthService.getSession();
      if (session?.user) {
        const profile = await AuthService.getUserProfile(session.user.id);
        set({ user: profile, isAuthenticated: true, isLoading: false, error: null });
        await useSettingsStore.getState().loadProfileImage(profile.id);
      } else {
        useSettingsStore.getState().clearProfileImageState();
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    } catch (err) {
      useSettingsStore.getState().clearProfileImageState();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => {
    if (!user) {
      useSettingsStore.getState().clearProfileImageState();
    } else {
      void useSettingsStore.getState().loadProfileImage(user.id);
    }
    set({ user, isAuthenticated: !!user });
  },
}));
