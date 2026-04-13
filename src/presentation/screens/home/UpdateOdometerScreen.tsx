import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HelperText, Menu, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppButton } from '@presentation/components/common/AppButton';
import { AppInput } from '@presentation/components/common/AppInput';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useNotification } from '@presentation/hooks/useNotification';
import type { UpdateOdometerScreenProps } from '@presentation/navigation/types';

interface FormData {
  vehicleId: string;
  currentKm: number;
}

export function UpdateOdometerScreen({ navigation, route }: UpdateOdometerScreenProps) {
  const { colors } = useTheme();
  const { vehicles, updateVehicle } = useVehicleStore();
  const { requestPermission, scheduleServiceReminder } = useNotification();
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const { control, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      vehicleId: route.params?.vehicleId ?? '',
      currentKm: 0,
    },
  });


  useEffect(() => {
    if (route.params?.vehicleId) {
      const vehicle = vehicles.find((item) => item.id === route.params.vehicleId);
      if (vehicle) {
        setValue('vehicleId', vehicle.id);
        setValue('currentKm', vehicle.currentKm);
      }
    }
  }, [route.params?.vehicleId, vehicles, setValue]);

  const handleVehicleSelect = useCallback(
    (vehicleId: string) => {
      const vehicle = vehicles.find((item) => item.id === vehicleId);
      if (vehicle) {
        setValue('vehicleId', vehicleId);
        setValue('currentKm', vehicle.currentKm);
      }
      setMenuVisible(false);
    },
    [setValue, vehicles],
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!data.vehicleId) {
        return;
      }

      try {
        await updateVehicle(data.vehicleId, { currentKm: data.currentKm });
        await requestPermission();
        const selected = vehicles.find((vehicle) => vehicle.id === data.vehicleId);
        if (selected) {
          await scheduleServiceReminder(selected);
        }
        setSnackbar('Odometer berhasil diperbarui.');
        navigation.goBack();
      } catch {
        setSnackbar('Gagal memperbarui odometer.');
      }
    },
    [navigation, requestPermission, scheduleServiceReminder, updateVehicle, vehicles],
  );

  if (vehicles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
        <EmptyState
          icon="garage-open"
          title="Tidak ada kendaraan"
          description="Tambahkan kendaraan dulu agar bisa memperbarui odometer."
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
        <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>Perbarui Odometer</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Pilih kendaraan dan masukkan kilometer terbaru.</Text>

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
                    onPress={() => handleVehicleSelect(vehicle.id)}
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
          name="currentKm"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Kilometer Saat Ini"
              value={String(value)}
              onChangeText={(text) => onChange(Number(text) || 0)}
              onBlur={onBlur}
              placeholder="Masukkan kilometer terakhir"
              keyboardType="numeric"
            />
          )}
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
            label="Simpan Odometer"
            onPress={handleSubmit(onSubmit)}
            fullWidth={false}
            style={styles.saveButton}
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
