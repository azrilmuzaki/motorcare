import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';

import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  NOTIFICATION_DAYS_BEFORE,
} from '@core/constants/notification.constants';
import { calculateNextServiceDate } from '@domain/logic/vehicle.logic';
import type { Vehicle } from '@domain/types/vehicle.types';
import { useSettingsStore } from '@presentation/store/settings.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotification() {
  const { notificationsEnabled } = useSettingsStore();

  const ensureAndroidChannel = useCallback(async () => {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#246BFD',
      sound: 'default',
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    await ensureAndroidChannel();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, [ensureAndroidChannel]);

  const scheduleServiceReminder = useCallback(
    async (vehicle: Vehicle): Promise<void> => {
      if (!notificationsEnabled || !vehicle.estimatedDays) {
        return;
      }

      const notificationDate = calculateNextServiceDate(
        vehicle.estimatedDays - NOTIFICATION_DAYS_BEFORE,
      );

      if (notificationDate <= new Date()) {
        return;
      }

      await ensureAndroidChannel();

      await Notifications.scheduleNotificationAsync({
        identifier: `service-${vehicle.id}`,
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

  const cancelVehicleReminder = useCallback(async (vehicleId: string) => {
    await Notifications.cancelScheduledNotificationAsync(`service-${vehicleId}`);
  }, []);

  const cancelAllReminders = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return {
    requestPermission,
    scheduleServiceReminder,
    cancelVehicleReminder,
    cancelAllReminders,
  };
}
