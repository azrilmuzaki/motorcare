import { useCallback } from 'react';
import Constants from 'expo-constants';

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
  if (Constants.appOwnership === 'expo') {
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
      if (!notificationsEnabled || !vehicle.estimatedDays) {
        return;
      }

      const Notifications = await getNotificationsModule();
      if (!Notifications) {
        return;
      }

      const notificationDate = calculateNextServiceDate(
        vehicle.estimatedDays - NOTIFICATION_DAYS_BEFORE,
      );

      if (notificationDate <= new Date()) {
        return;
      }

      const channelReady = await ensureAndroidChannel();
      if (!channelReady) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Jadwal servis mendekat',
          body: `${vehicle.name} perlu ${vehicle.serviceType.toLowerCase()} dalam ${NOTIFICATION_DAYS_BEFORE} hari lagi.`,
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
