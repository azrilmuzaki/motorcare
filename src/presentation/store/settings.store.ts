import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

import i18n from '../../../i18n';
import { AppLanguage, isRtlLanguage } from '@core/utils/i18n.utils';

export type Language = AppLanguage;
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsStore {
  language: Language;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  profileImageUri: string | null;

  setLanguage: (lang: Language) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setProfileImageUri: (userId: string, uri: string | null) => Promise<void>;
  loadProfileImage: (userId: string | null | undefined) => Promise<void>;
  clearProfileImageState: () => void;
  loadLanguage: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEYS = {
  LANGUAGE: '@garasi_lang',
  THEME: '@garasi_theme',
  NOTIFICATIONS: '@garasi_notif',
  PROFILE_IMAGE_LEGACY: '@motorcare_profile_image',
} as const;

function getProfileImageStorageKey(userId: string) {
  return `@motorcare_profile_image:${userId}`;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: 'id',
  themeMode: 'system',
  notificationsEnabled: true,
  profileImageUri: null,

  loadSettings: async () => {
    try {
      const [theme, notif] = await AsyncStorage.multiGet([
        STORAGE_KEYS.THEME,
        STORAGE_KEYS.NOTIFICATIONS,
      ]);
      set({
        themeMode: (theme[1] as ThemeMode) ?? 'system',
        notificationsEnabled: notif[1] !== 'false',
      });
      await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE_LEGACY).catch(() => undefined);
    } catch {
      // Use defaults on error
    }
  },

  setLanguage: async (lang) => {
    const shouldUseRTL = isRtlLanguage(lang);
    const directionChanged = I18nManager.isRTL !== shouldUseRTL;

    if (directionChanged) {
      I18nManager.allowRTL(shouldUseRTL);
      I18nManager.forceRTL(shouldUseRTL);
    }

    await i18n.changeLanguage(lang);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = shouldUseRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    set({ language: lang });
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);

    if (directionChanged && Platform.OS !== 'web') {
      try {
        const Updates = await import('expo-updates');
        await Updates.reloadAsync();
      } catch (err) {
        console.error('Failed to reload application:', err);
      }
    }
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(enabled));
  },

  setProfileImageUri: async (userId, uri) => {
    const storageKey = getProfileImageStorageKey(userId);
    set({ profileImageUri: uri });

    if (uri) {
      await AsyncStorage.setItem(storageKey, uri);
      return;
    }

    await AsyncStorage.removeItem(storageKey);
  },

  loadProfileImage: async (userId) => {
    if (!userId) {
      set({ profileImageUri: null });
      return;
    }

    try {
      const imageUri = await AsyncStorage.getItem(getProfileImageStorageKey(userId));
      set({ profileImageUri: imageUri ?? null });
    } catch {
      set({ profileImageUri: null });
    }
  },

  clearProfileImageState: () => set({ profileImageUri: null }),

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      const nextLanguage: Language = (stored as Language) || 'id';

      const shouldUseRTL = isRtlLanguage(nextLanguage);

      if (I18nManager.isRTL !== shouldUseRTL) {
        I18nManager.allowRTL(shouldUseRTL);
        I18nManager.forceRTL(shouldUseRTL);
      }

      await i18n.changeLanguage(nextLanguage);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.documentElement.dir = shouldUseRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = nextLanguage;
      }

      set({ language: nextLanguage });
    } catch {
      set({ language: 'id' });
    }
  },
}));
