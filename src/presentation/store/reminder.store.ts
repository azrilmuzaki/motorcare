import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { Reminder } from '@domain/types/reminder.types';

interface ReminderStore {
  reminders: Reminder[];
  isLoading: boolean;
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
}

const STORAGE_KEY = '@motorcare_reminders';

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  isLoading: false,

  loadReminders: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const reminders = stored ? (JSON.parse(stored) as Reminder[]) : [];
      const activeReminders = reminders
        .filter(item => new Date(item.reminderDate) > new Date())
        .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());

      set({ reminders: activeReminders, isLoading: false });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeReminders));
    } catch {
      set({ reminders: [], isLoading: false });
    }
  },

  addReminder: async (reminder) => {
    const nextReminders = [reminder, ...get().reminders].sort(
      (a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime(),
    );
    set({ reminders: nextReminders });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextReminders));
  },

  removeReminder: async (id) => {
    const nextReminders = get().reminders.filter(item => item.id !== id);
    set({ reminders: nextReminders });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextReminders));
  },
}));
