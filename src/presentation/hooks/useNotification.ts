import { useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  NOTIFICATION_DAYS_BEFORE,
} from '@core/constants/notification.constants';
import { calculateNextServiceDate, getServiceStatus } from '@domain/logic/vehicle.logic';
import type { Vehicle, VehicleComponent } from '@domain/types/vehicle.types';
import { useSettingsStore } from '@presentation/store/settings.store';

let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (Platform.OS === 'web') {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export function useNotification() {
  const { notificationsEnabled } = useSettingsStore();

  const ensureAndroidChannel = useCallback(async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return false;
    }

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#246BFD',
      sound: 'default',
    });

    return true;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return false;
    }

    const channelReady = await ensureAndroidChannel();
    if (!channelReady) {
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, [ensureAndroidChannel]);

  const scheduleServiceReminder = useCallback(
    async (vehicle: Vehicle): Promise<void> => {
      if (!notificationsEnabled || vehicle.estimatedDays === undefined) {
        return;
      }

      const Notifications = await getNotificationsModule();
      if (!Notifications) {
        return;
      }

      let notificationDate = calculateNextServiceDate(
        vehicle.estimatedDays - NOTIFICATION_DAYS_BEFORE,
      );

      // Jika tanggal pengingat sudah lewat atau hari ini, jadwalkan 10 detik dari sekarang
      // agar user langsung mendapat peringatan bahwa servisnya sudah sangat dekat atau terlambat!
      if (notificationDate <= new Date()) {
        notificationDate = new Date(Date.now() + 10 * 1000);
      }

      const channelReady = await ensureAndroidChannel();
      if (!channelReady) {
        return;
      }

      const bodyText = vehicle.estimatedDays > 0
        ? `${vehicle.name} perlu ${vehicle.serviceType.toLowerCase()} dalam ${vehicle.estimatedDays} hari lagi.`
        : `${vehicle.name} sudah melewati jadwal ${vehicle.serviceType.toLowerCase()}!`;

      await Notifications.scheduleNotificationAsync({
        identifier: `service-${vehicle.id}`,
        content: {
          title: vehicle.estimatedDays > 0 ? 'Jadwal servis mendekat' : 'Jadwal servis terlambat',
          body: bodyText,
          data: { vehicleId: vehicle.id },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
    },
    [ensureAndroidChannel, notificationsEnabled],
  );

  const scheduleReminder = useCallback(
    async (
      title: string,
      body: string,
      date: Date,
      data: Record<string, unknown> = {},
    ): Promise<string | null> => {
      if (!notificationsEnabled || date <= new Date()) {
        return null;
      }

      const Notifications = await getNotificationsModule();
      if (!Notifications) {
        return null;
      }

      const channelReady = await ensureAndroidChannel();
      if (!channelReady) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });

      return notificationId;
    },
    [ensureAndroidChannel, notificationsEnabled],
  );

  const cancelVehicleReminder = useCallback(async (vehicleId: string) => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(`service-${vehicleId}`);
  }, []);

  const cancelAllReminders = useCallback(async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const checkAndTriggerMaintenanceNotifications = useCallback(
    async (vehicleName: string, enrichedComponents: VehicleComponent[]): Promise<void> => {
      if (!notificationsEnabled) {
        return;
      }

      const Notifications = await getNotificationsModule();
      let channelReady = false;
      if (Notifications) {
        channelReady = await ensureAndroidChannel();
      }

      const nowMs = Date.now();

      for (const comp of enrichedComponents) {
        if (comp.remainingKm === undefined) {
          continue;
        }

        const remainingKm = comp.remainingKm;
        const status = getServiceStatus(remainingKm);

        if (status === 'ok') {
          // Jika status aman (ok), hapus riwayat cooldown lama
          const keysToRemove = [
            `@garasi_last_notified:${comp.id}:warning`,
            `@garasi_last_notified:${comp.id}:urgent`,
            `@garasi_last_notified:${comp.id}:overdue`,
          ];
          try {
            await AsyncStorage.multiRemove(keysToRemove);
          } catch (err) {
            console.error('Failed to remove cooldown keys:', err);
          }
          continue;
        }

        // Check cooldown
        const storageKey = `@garasi_last_notified:${comp.id}:${status}`;
        let lastNotifiedTime = 0;
        try {
          const val = await AsyncStorage.getItem(storageKey);
          if (val) {
            lastNotifiedTime = new Date(val).getTime();
          }
        } catch (err) {
          console.error('Failed to read last notified time:', err);
        }

        // Cooldown: warning 24h, overdue 24h, urgent 12h
        let cooldownMs = 24 * 60 * 60 * 1000;
        if (status === 'urgent') {
          cooldownMs = 12 * 60 * 60 * 1000;
        }

        const isCooldownPassed = nowMs - lastNotifiedTime >= cooldownMs;

        if (isCooldownPassed) {
          let title = '';
          let body = '';

          if (status === 'warning') {
            title = '⚠️ Peringatan Servis Komponen';
            body = `Peringatan: ${comp.name} pada ${vehicleName} tinggal ${remainingKm.toLocaleString('id-ID')} km lagi menuju servis.`;
          } else if (status === 'urgent') {
            title = '🚨 Perhatian: Segera Servis!';
            body = `Perhatian: Servis ${comp.name} pada ${vehicleName} sudah sangat dekat, sisa ${remainingKm.toLocaleString('id-ID')} km lagi!`;
          } else if (status === 'overdue') {
            title = '⚫ Jadwal Servis Terlewat!';
            const overdueKm = Math.abs(remainingKm);
            body = `Terlambat: ${comp.name} pada ${vehicleName} telah melewati jadwal servis sebanyak ${overdueKm.toLocaleString('id-ID')} km!`;
          }

          if (Notifications && channelReady) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body,
                  data: { componentId: comp.id, vehicleId: comp.vehicleId, status },
                  sound: 'default',
                },
                trigger: null,
              });
            } catch (err) {
              console.error('Failed to schedule local notification:', err);
            }
          }

          try {
            await AsyncStorage.setItem(storageKey, new Date(nowMs).toISOString());
          } catch (err) {
            console.error('Failed to set last notified time:', err);
          }
        }
      }
    },
    [ensureAndroidChannel, notificationsEnabled]
  );

  return {
    requestPermission,
    scheduleServiceReminder,
    scheduleReminder,
    cancelVehicleReminder,
    cancelAllReminders,
    checkAndTriggerMaintenanceNotifications,
  };
}

