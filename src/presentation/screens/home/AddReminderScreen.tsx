import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HelperText, Menu, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppButton } from '@presentation/components/common/AppButton';
import { AppInput } from '@presentation/components/common/AppInput';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import { Colors } from '@core/theme/colors';
import { useAuthStore } from '@presentation/store/auth.store';
import { useReminderStore } from '@presentation/store/reminder.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useNotification } from '@presentation/hooks/useNotification';
import type { AddReminderScreenProps } from '@presentation/navigation/types';

interface FormData {
  vehicleId: string;
  serviceType: string;
  note: string;
  reminderDate: string;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function AddReminderScreen({ navigation }: AddReminderScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { vehicles, fetchVehicles, isLoading } = useVehicleStore();
  const { addReminder } = useReminderStore();
  const { requestPermission, scheduleReminder } = useNotification();
  const [menuVisible, setMenuVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const defaultReminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      vehicleId: '',
      serviceType: '',
      note: '',
      reminderDate: defaultReminderDate.toISOString(),
    },
  });

  const selectedVehicleId = watch('vehicleId');
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );
  const selectedReminderDate = useMemo(() => {
    const rawDate = watch('reminderDate');
    if (!rawDate) {
      return defaultReminderDate;
    }

    const parsedDate = new Date(rawDate);
    return isNaN(parsedDate.getTime()) ? defaultReminderDate : parsedDate;
  }, [defaultReminderDate, watch]);

  useEffect(() => {
    if (user?.id) {
      void fetchVehicles(user.id);
    }
  }, [fetchVehicles, user?.id]);

  useEffect(() => {
    if (selectedVehicle?.serviceType) {
      setValue('serviceType', selectedVehicle.serviceType);
    }
  }, [selectedVehicle, setValue]);

  const handleSelectVehicle = useCallback(
    (vehicleId: string) => {
      setValue('vehicleId', vehicleId);
      setMenuVisible(false);
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        if (!data.vehicleId) {
          setSnackbar('Pilih kendaraan terlebih dahulu.');
          return;
        }

        const selected = vehicles.find((vehicle) => vehicle.id === data.vehicleId);
        if (!selected) {
          setSnackbar('Kendaraan tidak ditemukan.');
          return;
        }

        if (!data.reminderDate) {
          setSnackbar('Pilih tanggal pengingat terlebih dahulu.');
          return;
        }

        const reminderDate = new Date(data.reminderDate);
        if (isNaN(reminderDate.getTime()) || reminderDate <= new Date()) {
          setSnackbar('Pilih tanggal pengingat yang valid.');
          return;
        }

        const serviceType = data.serviceType.trim() || selected.serviceType;
        const note = data.note.trim();
        const notificationBody = `${selected.name} akan ${serviceType.toLowerCase()} pada ${formatDate(reminderDate)}.${note ? ` Catatan: ${note}` : ''}`;
        const isGranted = await requestPermission();

        const notificationId = isGranted
          ? await scheduleReminder(
              `Pengingat servis ${selected.name}`,
              notificationBody,
              reminderDate,
              {
                vehicleId: selected.id,
                serviceType,
                note,
              },
            )
          : null;

        await addReminder({
          id: `reminder-${selected.id}-${reminderDate.getTime()}`,
          vehicleId: selected.id,
          vehicleName: selected.name,
          serviceType,
          note,
          reminderDate: reminderDate.toISOString(),
          notificationId: notificationId ?? '',
          createdAt: new Date().toISOString(),
        });

        navigation.navigate('Main', {
          screen: 'Home',
          params: {
            reminderMessage: isGranted && notificationId
              ? 'Pengingat servis berhasil ditambahkan.'
              : 'Pengingat berhasil disimpan, tetapi notifikasi belum aktif di Expo Go.',
          },
        });
      } catch (error) {
        setSnackbar('Gagal menyimpan pengingat. Coba lagi.');
      }
    },
    [addReminder, navigation, requestPermission, scheduleReminder, vehicles],
  );

  if (!isLoading && vehicles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
        <EmptyState
          icon="garage-open"
          title="Tidak ada kendaraan"
          description="Tambahkan kendaraan dulu agar bisa membuat pengingat servis."
          actionLabel="Tambah Kendaraan"
          onAction={() => navigation.navigate('AddVehicle')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >
        <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>Tambah Pengingat</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Pilih kendaraan dan aktifkan notifikasi servis.</Text>

        <Controller
          control={control}
          name="vehicleId"
          render={({ field: { value } }) => (
            <View style={styles.field}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setMenuVisible(true)}>
                    <AppInput
                      label="Kendaraan"
                      value={vehicles.find((vehicle) => vehicle.id === value)?.name ?? ''}
                      onChangeText={() => undefined}
                      editable={false}
                      placeholder="Pilih kendaraan"
                      error={''}
                      left={<TextInput.Icon icon="car" />}
                    />
                  </Pressable>
                }
              >
                {vehicles.map((vehicle) => (
                  <Menu.Item
                    key={vehicle.id}
                    title={vehicle.name}
                    onPress={() => handleSelectVehicle(vehicle.id)}
                  />
                ))}
              </Menu>
              {!value ? (
                <HelperText type="error" visible>
                  Pilih kendaraan terlebih dahulu.
                </HelperText>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="serviceType"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Jenis Servis"
              value={value}
              onChangeText={onChange}
              placeholder="Contoh: Ganti Oli"
              left={<TextInput.Icon icon="wrench" />}
            />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, value } }) => (
            <AppInput
              label="Catatan"
              value={value}
              onChangeText={onChange}
              placeholder="Misal: ganti oli 0W-20"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="note" />}
            />
          )}
        />

        <Controller
          control={control}
          name="reminderDate"
          render={({ field: { value } }) => {
            const displayDate = value ? formatDate(new Date(value)) : formatDate(defaultReminderDate);

            return (
              <Pressable onPress={() => setDatePickerVisible(true)}>
                <AppInput
                  label="Tanggal Pengingat"
                  value={displayDate}
                  onChangeText={() => undefined}
                  editable={false}
                  placeholder="Pilih tanggal"
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => setDatePickerVisible(true)}
                    />
                  }
                />
              </Pressable>
            );
          }}
        />

        <DateTimePickerModal
          isVisible={datePickerVisible}
          mode="date"
          date={selectedReminderDate}
          onConfirm={(date) => {
            setDatePickerVisible(false);
            setValue('reminderDate', date.toISOString());
          }}
          onCancel={() => setDatePickerVisible(false)}
          minimumDate={new Date()}
        />

        <View style={styles.actionsRow}>
          <AppButton
            label="Batal"
            onPress={() => navigation.goBack()}
            variant="outlined"
            fullWidth={false}
            style={styles.cancelButton}
          />
          <AppButton
            label="Simpan Pengingat"
            onPress={handleSubmit(onSubmit)}
            fullWidth={false}
            style={[styles.saveButton, { backgroundColor: Colors.primaryDark }]}
          />
        </View>
      </KeyboardAwareScrollView>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginBottom: 24,
  },
  field: {
    gap: 8,
  },
});
