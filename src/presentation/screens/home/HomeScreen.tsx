import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FAB, Snackbar, Text, Button, Menu, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import type { Vehicle, ServiceStatus, VehicleComponent } from '@domain/types/vehicle.types';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { RootStackParamList } from '@presentation/navigation/types';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useComponentStore } from '@presentation/store/component.store';
import { useServiceLogStore } from '@presentation/store/serviceLog.store';
import { enrichComponent, getServiceStatus } from '@domain/logic/vehicle.logic';
import { ComponentCard } from '@presentation/components/ComponentCard';
import { useNotification } from '@presentation/hooks/useNotification';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { vehicles, error, successMessage, clearError, clearSuccessMessage, selectVehicle } = useVehicles();
  const { components, loadComponents } = useComponentStore();
  const { checkAndTriggerMaintenanceNotifications } = useNotification();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedComponentAction, setSelectedComponentAction] = useState<VehicleComponent | null>(null);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    } else if (vehicles.length === 0 && selectedVehicleId) {
      setSelectedVehicleId(null);
    } else if (selectedVehicleId && !vehicles.find(v => v.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicles.length > 0 ? vehicles[0].id : null);
    }
  }, [vehicles, selectedVehicleId]);

  const activeVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    if (activeVehicle) {
      void loadComponents(activeVehicle.id);
    }
  }, [activeVehicle?.id, loadComponents]);

  const enrichedComponents = useMemo(() => {
    if (!activeVehicle) return [];
    return components.map(c => enrichComponent(
      c,
      activeVehicle.projectedCurrentKm ?? activeVehicle.currentKm,
      activeVehicle.dailyEst
    ));
  }, [components, activeVehicle]);

  useEffect(() => {
    if (activeVehicle && enrichedComponents.length > 0) {
      void checkAndTriggerMaintenanceNotifications(activeVehicle.name, enrichedComponents);
    }
  }, [activeVehicle?.id, activeVehicle?.name, enrichedComponents, checkAndTriggerMaintenanceNotifications]);

  const overallStatus = useMemo(() => {
    if (enrichedComponents.length === 0) return 'ok';
    let worstStatus: ServiceStatus = 'ok';
    for (const comp of enrichedComponents) {
      const status = getServiceStatus(comp.remainingKm ?? 0);
      if (status === 'overdue') return 'overdue';
      if (status === 'urgent') worstStatus = 'urgent';
      if (status === 'warning' && worstStatus === 'ok') worstStatus = 'warning';
    }
    return worstStatus;
  }, [enrichedComponents]);

  const handleAddVehicle = useCallback(() => navigation.navigate('AddVehicle'), [navigation]);
  const handleUpdateOdometer = useCallback(() => {
    navigation.navigate('UpdateOdometer', { vehicleId: activeVehicle?.id });
  }, [navigation, activeVehicle]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    useVehicleStore.getState().selectVehicle(vehicle);
    setMenuVisible(false);
  };

  const handleComponentAction = (component: VehicleComponent) => {
    setSelectedComponentAction(component);
  };

  const handleMarkComponentServiced = async () => {
    if (!selectedComponentAction || !activeVehicle) return;
    try {
      const projectedCurrentKm = activeVehicle.projectedCurrentKm ?? activeVehicle.currentKm;
      const roundedServiceKm = Math.round(projectedCurrentKm);
      await useComponentStore.getState().updateComponent(selectedComponentAction.id, {
        lastServiceKm: roundedServiceKm,
      });
      await useServiceLogStore.getState().addLog({
        vehicleId: activeVehicle.id,
        serviceDate: new Date().toISOString(),
        serviceKm: roundedServiceKm,
        notes: `Servis komponen selesai: ${selectedComponentAction.name}`,
      });
      setSelectedComponentAction(null);
    } catch (e) {
      console.error('Failed to mark as serviced', e);
      Alert.alert('Gagal Menyimpan', 'Gagal menyimpan riwayat servis komponen ke database. Silakan coba lagi.');
    }
  };

  const handleDeleteComponent = async () => {
    if (!selectedComponentAction) return;
    try {
      await useComponentStore.getState().deleteComponent(selectedComponentAction.id);
      setSelectedComponentAction(null);
    } catch (e) {
      console.error('Failed to delete component', e);
    }
  };

  const locale = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';

  // ── Empty State ──────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
        <MaterialCommunityIcons name="garage-open" size={64} color={Colors.primary} />
      </View>
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: colors.onBackground }]}>
        Garasi Anda Kosong
      </Text>
      <Text variant="bodyMedium" style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
        Tambahkan kendaraan pertama Anda untuk mulai memantau servis, pengingat odometer, dan riwayat perawatan secara otomatis.
      </Text>
      <Button
        mode="contained"
        onPress={handleAddVehicle}
        style={styles.emptyButton}
        contentStyle={styles.emptyButtonContent}
        labelStyle={styles.emptyButtonLabel}
      >
        Tambah Kendaraan Pertama
      </Button>
    </View>
  );

  // ── Blue Hero Area ───────────────────────────────────────────────────────
  const renderBlueHero = () => {
    if (!activeVehicle) return null;
    const typeIcon = VEHICLE_TYPE_ICONS[activeVehicle.type] ?? 'car';
    const projectedCurrentKm = activeVehicle.projectedCurrentKm ?? activeVehicle.currentKm;

    // Status banner config
    let bannerBg: string = Colors.success;
    let bannerTitle = 'SANGAT BAIK';
    let bannerDesc = 'Semua komponen aman';
    let bannerIcon: any = 'check-circle';
    if (overallStatus === 'overdue') {
      bannerBg = '#7F1D1D';
      bannerTitle = 'JADWAL LEWAT';
      bannerDesc = 'Motor Anda telah melewati jadwal servis';
      bannerIcon = 'alert-octagon';
    } else if (overallStatus === 'urgent') {
      bannerBg = Colors.error;
      bannerTitle = 'PERHATIAN';
      bannerDesc = 'Ada komponen yang harus segera diganti';
      bannerIcon = 'alert-circle';
    } else if (overallStatus === 'warning') {
      bannerBg = Colors.warning;
      bannerTitle = 'PERINGATAN';
      bannerDesc = 'Beberapa komponen mendekati jadwal servis';
      bannerIcon = 'alert';
    }

    return (
      <View style={[styles.blueHero, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Dekorasi lingkaran */}
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />

        {/* ── Header: vehicle selector + wrench ── */}
        <View style={styles.appHeader}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Pressable style={styles.vehicleSelectorBtn} onPress={() => setMenuVisible(true)}>
                <MaterialCommunityIcons name={typeIcon} size={24} color="#fff" />
                <Text style={styles.vehicleSelectorText}>{activeVehicle.name}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
            }
            contentStyle={{ backgroundColor: isDark ? colors.surfaceElevated : colors.surface }}
          >
            {vehicles.map((v) => (
              <Menu.Item
                key={v.id}
                onPress={() => handleVehicleSelect(v)}
                title={v.name}
                leadingIcon={VEHICLE_TYPE_ICONS[v.type] ?? 'car'}
              />
            ))}
            <Menu.Item
              onPress={handleAddVehicle}
              title="Tambah Kendaraan"
              leadingIcon="plus"
              titleStyle={{ color: Colors.primary }}
            />
          </Menu>

          <Pressable
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: activeVehicle.id })}
          >
            <MaterialCommunityIcons name="wrench-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* ── Odometer ── */}
        <View style={styles.odometerSection}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <Text style={styles.badgeText}>Auto-Track</Text>
            </View>
            <View style={styles.pillBadge}>
              <View style={[styles.dot, { backgroundColor: '#B5D4F4' }]} />
              <Text style={styles.badgeText}>Odometer Update</Text>
            </View>
          </View>

          {/* Odometer card */}
          <View style={styles.odometerCard}>
            <View style={styles.odometerContent}>
              <MaterialCommunityIcons name="speedometer" size={36} color="#fff" />
              <Text style={styles.odometerValue}>
                {projectedCurrentKm.toLocaleString(locale)}{' '}
                <Text style={styles.odometerUnit}>km</Text>
              </Text>
            </View>
            <Pressable style={styles.odoSettingsBtn} onPress={handleUpdateOdometer}>
              <MaterialCommunityIcons name="cog" size={22} color="#185FA5" />
            </Pressable>
          </View>
        </View>

        {/* ── Status Banner ── */}
        {enrichedComponents.length > 0 && (
          <View style={[styles.statusBanner, { backgroundColor: bannerBg }]}>
            <Text style={styles.statusBannerTitle}>{bannerTitle}</Text>
            <View style={styles.statusBannerInner}>
              <MaterialCommunityIcons name={bannerIcon} size={18} color={bannerBg} />
              <Text style={styles.statusBannerDesc}>{bannerDesc}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── Components Grid ──────────────────────────────────────────────────────
  const renderComponentsGrid = () => {
    if (!activeVehicle) return null;
    return (
      <View style={styles.componentsSection}>
        <View style={styles.componentsHeader}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Components
          </Text>
          <Button
            mode="contained"
            compact
            style={{ borderRadius: 20 }}
            onPress={() => {
              if (activeVehicle) {
                selectVehicle(activeVehicle);
                navigation.navigate('AddComponent');
              }
            }}
          >
            + Tambah
          </Button>
        </View>

        {enrichedComponents.length > 0 ? (
          <View style={styles.gridContainer}>
            {enrichedComponents.map((comp) => (
              <View key={comp.id} style={styles.gridItem}>
                <ComponentCard component={comp} onPress={() => handleComponentAction(comp)} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyComponentCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
            <MaterialCommunityIcons name="toy-brick-outline" size={40} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyComponentText, { color: colors.onSurfaceVariant }]}>
              Belum ada komponen servis yang dilacak.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {vehicles.length > 0 ? (
          <>
            {renderBlueHero()}
            {renderComponentsGrid()}
          </>
        ) : (
          <>
            {/* Tetap tampilkan padding top saat empty */}
            <View style={{ height: insets.top }} />
            {renderEmptyState()}
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={!!selectedComponentAction}
          onDismiss={() => setSelectedComponentAction(null)}
          contentContainerStyle={[styles.actionModal, { backgroundColor: colors.background }]}
        >
          <View style={styles.actionModalHeader}>
            <MaterialCommunityIcons
              name={(selectedComponentAction?.icon as any) ?? 'cog'}
              size={32}
              color={colors.onBackground}
            />
            <Text variant="titleLarge" style={[styles.actionModalTitle, { color: colors.onBackground }]}>
              {selectedComponentAction?.name}
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.actionModalDesc, { color: colors.onSurfaceVariant }]}>
            Apa yang ingin Anda lakukan dengan komponen ini?
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
            Hapus Komponen
          </Button>
        </Modal>
      </Portal>

      {vehicles.length > 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
          color={Colors.white}
          onPress={handleAddVehicle}
        />
      )}

      <Snackbar visible={Boolean(error)} onDismiss={clearError} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={Boolean(successMessage)} onDismiss={clearSuccessMessage} duration={2800}>
        {successMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── Blue Hero ──────────────────────────────────────────────────────────
  blueHero: {
    backgroundColor: '#185FA5',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    // Rounded bottom corners only
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: Spacing.md,
  },
  heroDeco1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -40,
  },
  heroDeco2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 10,
    left: -20,
  },

  // ── Header ────────────────────────────────────────────────────────────
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  vehicleSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleSelectorText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Odometer ──────────────────────────────────────────────────────────
  odometerSection: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  odometerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  odometerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  odometerValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  odometerUnit: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  odoSettingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  // ── Status Banner ─────────────────────────────────────────────────────
  statusBanner: {
    borderRadius: 16,
    paddingTop: 10,
    overflow: 'hidden',
  },
  statusBannerTitle: {
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 1,
    color: '#fff',
    marginBottom: 6,
  },
  statusBannerInner: {
    backgroundColor: Colors.white,
    marginHorizontal: 2,
    marginBottom: 2,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  statusBannerDesc: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.black,
  },

  // ── Components ────────────────────────────────────────────────────────
  componentsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  componentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.xs,
  },
  emptyComponentCard: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyComponentText: {
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },

  // ── Empty State ───────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: BorderRadius.full,
    width: '100%',
  },
  emptyButtonContent: { paddingVertical: 8 },
  emptyButtonLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },

  // ── Modal ─────────────────────────────────────────────────────────────
  actionModal: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: 24,
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

  // ── FAB ───────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
});