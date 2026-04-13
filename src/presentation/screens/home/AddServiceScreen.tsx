import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HelperText, Menu, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppButton } from '@presentation/components/common/AppButton';
import { AppInput } from '@presentation/components/common/AppInput';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useServiceLogStore } from '@presentation/store/serviceLog.store';
import type { AddServiceScreenProps } from '@presentation/navigation/types';

interface FormData {
  vehicleId: string;
  serviceType: string;
  serviceKm: number;
  notes: string;
}

export function AddServiceScreen({ navigation }: AddServiceScreenProps) {
  const { colors } = useTheme();
  const { vehicles } = useVehicleStore();
  const { addLog } = useServiceLogStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const { control, handleSubmit, setValue, formState } = useForm<FormData>({
    defaultValues: {
      vehicleId: '',
      serviceType: '',
      serviceKm: 0,
      notes: '',
    },
  });


  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!data.vehicleId) {
        return;
      }

      try {
        await addLog({
          vehicleId: data.vehicleId,
          serviceDate: new Date().toISOString(),
          serviceKm: data.serviceKm,
          notes: data.notes || undefined,
        });
        setSnackbar('Data servis berhasil disimpan.');
        navigation.goBack();
      } catch {
        setSnackbar('Gagal menyimpan data servis.');
      }
    },
    [addLog, navigation],
  );

  if (vehicles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
        <EmptyState
          icon="garage-open"
          title="Tidak ada kendaraan"
          description="Tambahkan kendaraan dulu agar bisa mencatat servis."
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
        <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>Tambah Servis</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Catat servis kendaraan terbaru dengan cepat.</Text>

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
                    onPress={() => {
                      setValue('vehicleId', vehicle.id);
                      setMenuVisible(false);
                    }}
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
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Jenis Servis"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Contoh: Ganti Oli"
              error={formState.errors.serviceType?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="serviceKm"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Kilometer Servis"
              value={String(value)}
              onChangeText={(text) => onChange(Number(text) || 0)}
              onBlur={onBlur}
              placeholder="Masukkan kilometer saat servis"
              keyboardType="numeric"
              error={formState.errors.serviceKm?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Catatan"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Opsional"
              multiline
              numberOfLines={3}
            />
          )}
        />

        <AppButton
          label="Simpan Servis"
          onPress={handleSubmit(onSubmit)}
        />
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
