import { useCallback } from 'react';

import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  NOTIFICATION_DAYS_BEFORE,
} from '@core/constants/notification.constants';
import { calculateNextServiceDate } from '@domain/logic/vehicle.logic';
import type { Vehicle } from '@domain/types/vehicle.types';
import { useSettingsStore } from '@presentation/store/settings.store';

let notificationHandlerConfigured = false;

async function getNotificationsModule() {
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

  return {
    requestPermission,
    scheduleServiceReminder,
    scheduleReminder,
    cancelVehicleReminder,
    cancelAllReminders,
  };
}
