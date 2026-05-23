import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Text, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicles } from '@presentation/hooks/useVehicles';
import { useComponentStore } from '@presentation/store/component.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useServiceLogStore } from '@presentation/store/serviceLog.store';
import type { RootStackParamList } from '@presentation/navigation/types';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { enrichComponent, getServiceStatus } from '@domain/logic/vehicle.logic';
import type { VehicleComponent } from '@domain/types/vehicle.types';

type VehicleDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

const STATUS_COLORS: Record<string, string> = {
  ok: Colors.success,
  warning: Colors.warning,
  urgent: Colors.secondary,
  overdue: Colors.error,
};

export function VehicleDetailScreen({ route, navigation }: VehicleDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const { vehicles, deleteVehicle, isLoading } = useVehicles();
  const { components, loadComponents } = useComponentStore();
  const { vehicleId } = route.params;

  const [selectedComponentAction, setSelectedComponentAction] = useState<VehicleComponent | null>(null);

  const vehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  // Sync selected vehicle and load its components
  useEffect(() => {
    if (vehicle) {
      useVehicleStore.getState().selectVehicle(vehicle);
      void loadComponents(vehicle.id);
    }
  }, [vehicle, loadComponents]);

  const locale = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';
  const projectedCurrentKm = vehicle?.projectedCurrentKm ?? vehicle?.currentKm ?? 0;

  // Enrich components with active odometer data
  const enrichedComponents = useMemo(() => {
    if (!vehicle) return [];
    return components.map((c) => enrichComponent(c, projectedCurrentKm, vehicle.dailyEst));
  }, [components, vehicle, projectedCurrentKm]);

  // Overall Health Status based on worst component status
  const overallHealth = useMemo(() => {
    if (enrichedComponents.length === 0) {
      return {
        status: 'none',
        label: 'Belum Ada Komponen',
        color: Colors.primary,
        desc: 'Tambahkan komponen servis seperti oli atau rem untuk mulai dipantau.',
        icon: 'toy-brick-outline' as any,
      };
    }

    let worstStatus = 'ok';
    for (const comp of enrichedComponents) {
      const compStatus = getServiceStatus(comp.remainingKm ?? 0);
      if (compStatus === 'overdue' || compStatus === 'urgent') {
        worstStatus = 'urgent';
        break;
      } else if (compStatus === 'warning') {
        worstStatus = 'warning';
      }
    }

    if (worstStatus === 'urgent') {
      return {
        status: 'urgent',
        label: 'Perlu Servis Segera',
        color: Colors.error,
        desc: 'Ada komponen yang mendesak untuk diganti!',
        icon: 'alert-circle' as any,
      };
    } else if (worstStatus === 'warning') {
      return {
        status: 'warning',
        label: 'Perlu Perhatian',
        color: Colors.warning,
        desc: 'Beberapa komponen mendekati batas interval pemakaian.',
        icon: 'alert' as any,
      };
    } else {
      return {
        status: 'ok',
        label: 'Kondisi Prima',
        color: Colors.success,
        desc: 'Semua komponen dalam kondisi baik dan aman.',
        icon: 'check-circle' as any,
      };
    }
  }, [enrichedComponents]);

  const handleComponentAction = (component: VehicleComponent) => {
    setSelectedComponentAction(component);
  };

  const handleMarkComponentServiced = async () => {
    if (!selectedComponentAction || !vehicle) return;
    try {
      const roundedServiceKm = Math.round(projectedCurrentKm);
      await useComponentStore.getState().updateComponent(selectedComponentAction.id, {
        lastServiceKm: roundedServiceKm,
      });

      // Simpan riwayat servis di database & store
      await useServiceLogStore.getState().addLog({
        vehicleId: vehicle.id,
        serviceDate: new Date().toISOString(),
        serviceKm: roundedServiceKm,
        notes: `Servis komponen selesai: ${selectedComponentAction.name}`,
      });

      setSelectedComponentAction(null);
    } catch (e) {
      console.error('Gagal menandai servis komponen', e);
      Alert.alert(
        'Gagal Menyimpan',
        'Gagal menyimpan riwayat servis komponen ke database. Silakan coba lagi.'
      );
    }
  };

  const handleDeleteComponent = async () => {
    if (!selectedComponentAction) return;
    try {
      await useComponentStore.getState().deleteComponent(selectedComponentAction.id);
      setSelectedComponentAction(null);
    } catch (e) {
      console.error('Gagal menghapus komponen', e);
    }
  };

  const handleAddComponent = useCallback(() => {
    if (vehicle) {
      useVehicleStore.getState().selectVehicle(vehicle);
      navigation.navigate('AddComponent');
    }
  }, [vehicle, navigation]);

  const handleUpdateOdometer = useCallback(() => {
    if (vehicle) {
      navigation.navigate('UpdateOdometer', { vehicleId: vehicle.id });
    }
  }, [navigation, vehicle]);

  const handleDeleteVehicle = useCallback(() => {
    if (!vehicle) return;

    Alert.alert(
      'Hapus Kendaraan',
      `Apakah Anda yakin ingin menghapus ${vehicle.name}? Semua data riwayat dan komponen kendaraan ini akan dihapus secara permanen dari akun Anda.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              navigation.goBack();
            } catch (err) {
              console.error('Gagal menghapus kendaraan', err);
            }
          },
        },
      ],
    );
  }, [vehicle, deleteVehicle, navigation]);

  const getEstimatedDateStr = (estimatedDays: number | undefined) => {
    if (estimatedDays === undefined) return 'Est. -';
    if (estimatedDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + estimatedDays);
      return `Est. ${date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return 'Perlu dicek';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant }}>
            Memuat detail kendaraan...
          </Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant }}>
            Kendaraan tidak ditemukan
          </Text>
        </View>
      </View>
    );
  }

  const typeIcon = VEHICLE_TYPE_ICONS[vehicle.type] || 'car';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Health Card */}
        <View style={[styles.headerCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
          <View style={[styles.vehicleIconBox, { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight }]}>
            <MaterialCommunityIcons name={typeIcon} size={36} color={Colors.primary} />
          </View>
          <Text variant="headlineSmall" style={[styles.vehicleName, { color: colors.onBackground }]}>
            {vehicle.name}
          </Text>

          <View style={[styles.healthBadge, { backgroundColor: `${overallHealth.color}16` }]}>
            <MaterialCommunityIcons name={overallHealth.icon} size={18} color={overallHealth.color} />
            <Text style={[styles.healthLabel, { color: overallHealth.color }]}>
              {overallHealth.label}
            </Text>
          </View>

          <Text variant="bodyMedium" style={[styles.healthDesc, { color: colors.onSurfaceVariant }]}>
            {overallHealth.desc}
          </Text>
        </View>

        {/* Odometer Stats Card */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="speedometer" size={18} color={Colors.primary} />
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>KM Sekarang</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.onBackground }]}>
                {projectedCurrentKm.toLocaleString(locale)} km
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name="calendar-clock" size={18} color={Colors.warning} />
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Estimasi Pemakaian</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.onBackground }]}>
                {vehicle.dailyEst.toLocaleString(locale)} km/hari
              </Text>
            </View>
          </View>

          <Button
            mode="contained-tonal"
            onPress={handleUpdateOdometer}
            icon="update"
            style={styles.updateOdoBtn}
            contentStyle={styles.updateOdoBtnContent}
          >
            Perbarui Odometer
          </Button>
        </View>

        {/* Component List Section */}
        <View style={styles.componentsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Komponen Servis ({enrichedComponents.length})
            </Text>
            <Button
              mode="text"
              compact
              icon="plus"
              onPress={handleAddComponent}
              labelStyle={styles.addBtnLabel}
            >
              Tambah
            </Button>
          </View>

          {enrichedComponents.length > 0 ? (
            <View style={styles.componentsList}>
              {enrichedComponents.map((comp) => {
                const compStatus = getServiceStatus(comp.remainingKm ?? 0);
                const compColor = STATUS_COLORS[compStatus] || Colors.primary;
                const remainingKmText =
                  comp.remainingKm !== undefined
                    ? comp.remainingKm <= 0
                      ? `Terlewat ${Math.abs(comp.remainingKm).toLocaleString(locale)} km`
                      : `${comp.remainingKm.toLocaleString(locale)} km lagi`
                    : '-';

                return (
                  <Pressable
                    key={comp.id}
                    style={[
                      styles.componentRow,
                      {
                        backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                        borderColor: isDark ? colors.outline : colors.surfaceVariant,
                      },
                    ]}
                    onPress={() => handleComponentAction(comp)}
                    android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                  >
                    <View style={[styles.componentIconBox, { backgroundColor: `${compColor}15` }]}>
                      <MaterialCommunityIcons name={comp.icon as any} size={24} color={compColor} />
                    </View>

                    <View style={styles.componentMeta}>
                      <Text variant="bodyLarge" style={[styles.componentName, { color: colors.onBackground }]}>
                        {comp.name}
                      </Text>
                      <Text variant="bodySmall" style={[styles.componentSubText, { color: colors.onSurfaceVariant }]}>
                        Batas: {comp.targetInterval.toLocaleString(locale)} km • Terakhir:{' '}
                        {comp.lastServiceKm.toLocaleString(locale)} km
                      </Text>
                    </View>

                    <View style={styles.componentRight}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.componentKm,
                          { color: compStatus === 'ok' ? colors.onBackground : compColor },
                        ]}
                      >
                        {remainingKmText}
                      </Text>
                      <Text variant="bodySmall" style={[styles.componentDate, { color: colors.onSurfaceVariant }]}>
                        {getEstimatedDateStr(comp.estimatedDays)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <MaterialCommunityIcons
                name="toy-brick-outline"
                size={48}
                color={colors.onSurfaceVariant}
                style={styles.emptyIcon}
              />
              <Text variant="titleMedium" style={[styles.emptyTitle, { color: colors.onBackground }]}>
                Belum Ada Komponen Dipantau
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
                Tambahkan komponen seperti Oli Mesin, Kampas Rem, atau Ban untuk mulai dipantau secara mandiri.
              </Text>
              <Button mode="contained" onPress={handleAddComponent} style={styles.emptyBtn}>
                Tambah Komponen
              </Button>
            </View>
          )}
        </View>

        {/* Danger Zone Section */}
        <View style={styles.dangerSection}>
          <View
            style={[
              styles.dangerCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                borderColor: isDark ? colors.outline : colors.surfaceVariant,
              },
            ]}
          >
            
            <Button
              mode="outlined"
              onPress={handleDeleteVehicle}
              style={styles.deleteBtn}
              textColor={Colors.error}
              icon="trash-can"
            >
              Hapus Kendaraan
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Component Action Modal */}
      <Portal>
        <Modal
          visible={!!selectedComponentAction}
          onDismiss={() => setSelectedComponentAction(null)}
          contentContainerStyle={[styles.actionModal, { backgroundColor: colors.background }]}
        >
          <View style={styles.actionModalHeader}>
            <MaterialCommunityIcons
              name={(selectedComponentAction?.icon as any) ?? 'cog'}
              size={36}
              color={colors.onBackground}
            />
            <Text variant="titleLarge" style={[styles.actionModalTitle, { color: colors.onBackground }]}>
              {selectedComponentAction?.name}
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.actionModalDesc, { color: colors.onSurfaceVariant }]}>
            Apakah Anda telah melakukan penggantian/servis pada komponen ini?
          </Text>

          <Button
            mode="contained"
            onPress={handleMarkComponentServiced}
            style={[styles.actionModalBtn, { backgroundColor: Colors.success }]}
            icon="check-circle"
          >
            Tandai Selesai Diservis
          </Button>

          <Button
            mode="outlined"
            onPress={handleDeleteComponent}
            style={[styles.actionModalBtn, { borderColor: Colors.error }]}
            textColor={Colors.error}
            icon="trash-can"
          >
            Hapus Komponen dari Pemantauan
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  headerCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  vehicleIconBox: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  healthLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  healthDesc: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  statsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 16,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  updateOdoBtn: {
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  updateOdoBtnContent: {
    paddingVertical: 4,
  },
  componentsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
  },
  addBtnLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  componentsList: {
    gap: Spacing.md,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  componentIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  componentMeta: {
    flex: 1,
    gap: 2,
  },
  componentName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  componentSubText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
  },
  componentRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  componentKm: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  componentDate: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 18,
    fontSize: 13,
  },
  emptyBtn: {
    borderRadius: BorderRadius.full,
  },
  dangerSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  dangerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dangerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.error,
  },
  deleteBtn: {
    borderRadius: BorderRadius.full,
    width: '100%',
  },
  actionModal: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  actionModalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionModalTitle: {
    fontFamily: 'Poppins_700Bold',
    marginTop: Spacing.xs,
  },
  actionModalDesc: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionModalBtn: {
    width: '100%',
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
