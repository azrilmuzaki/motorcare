import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HelperText, Menu, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppButton } from '@presentation/components/common/AppButton';
import { AppInput } from '@presentation/components/common/AppInput';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import { useNotification } from '@presentation/hooks/useNotification';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { UpdateOdometerScreenProps } from '@presentation/navigation/types';

interface FormData {
  vehicleId: string;
  currentKm: number;
}

export function UpdateOdometerScreen({ navigation, route }: UpdateOdometerScreenProps) {
  const { colors } = useTheme();
  const { vehicles, updateVehicle } = useVehicles();
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
        setValue('currentKm', Math.round(vehicle.projectedCurrentKm ?? vehicle.currentKm));
      }
    }
  }, [route.params?.vehicleId, vehicles, setValue]);

  const handleVehicleSelect = useCallback(
    (vehicleId: string) => {
      const vehicle = vehicles.find((item) => item.id === vehicleId);
      if (vehicle) {
        setValue('vehicleId', vehicleId);
        setValue('currentKm', Math.round(vehicle.projectedCurrentKm ?? vehicle.currentKm));
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

      const vehicle = vehicles.find((v) => v.id === data.vehicleId);
      const prevKm = vehicle ? Math.round(vehicle.projectedCurrentKm ?? vehicle.currentKm) : 0;
      const roundedKm = Math.round(data.currentKm);

      if (roundedKm < prevKm) {
        Alert.alert(
          'Kilometer Tidak Valid',
          `Kilometer baru tidak boleh lebih kecil dari kilometer saat ini (${prevKm.toLocaleString()} km).`
        );
        return;
      }

      try {
        const updatedVehicle = await updateVehicle(data.vehicleId, { currentKm: roundedKm });
        
        try {
          await requestPermission();
          await scheduleServiceReminder(updatedVehicle);
        } catch (notifError) {
          console.warn('Failed to schedule notification:', notifError);
        }

        setSnackbar('Odometer berhasil diperbarui.');
        navigation.goBack();
      } catch (err: any) {
        console.error(err);
        setSnackbar(`Gagal memperbarui odometer: ${err?.message || 'Terjadi kesalahan'}`);
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
