import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FAB, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import type { Vehicle } from '@domain/types/vehicle.types';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { useTheme } from '@presentation/hooks/useTheme';
import { useServiceLogs } from '@presentation/hooks/useServiceLogs';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { MainTabParamList, RootStackParamList } from '@presentation/navigation/types';
import { useReminderStore } from '@presentation/store/reminder.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const route = useRoute<RouteProp<MainTabParamList, 'Home'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    vehicles,
    error,
    successMessage,
    clearError,
    clearSuccessMessage,
  } = useVehicles();
  const { logs: serviceLogs } = useServiceLogs();
  const { reminders, loadReminders } = useReminderStore();
  const [fabOpen, setFabOpen] = useState(false);
  const [reminderSnackbar, setReminderSnackbar] = useState(route.params?.reminderMessage ?? '');

  const handleAddVehicle = useCallback(() => {
    navigation.navigate('AddVehicle');
    setFabOpen(false);
  }, [navigation]);

  const handleUpdateOdometer = useCallback(() => {
    navigation.navigate('UpdateOdometer', { vehicleId: undefined });
    setFabOpen(false);
  }, [navigation]);

  const handleAddReminder = useCallback(() => {
    navigation.navigate('AddReminder');
    setFabOpen(false);
  }, [navigation]);

  const handleAddService = useCallback(() => {
    navigation.navigate('AddService');
    setFabOpen(false);
  }, [navigation]);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      useVehicleStore.getState().selectVehicle(vehicle);
      navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
    },
    [navigation],
  );

  React.useEffect(() => {
    void loadReminders();
  }, [loadReminders]);


  const urgentVehicles = useMemo(
    () => vehicles.filter(vehicle => (vehicle.remainingKm ?? 0) <= 500).length,
    [vehicles],
  );

  const nextReminder = useMemo(
    () => reminders[0] ?? null,
    [reminders],
  );
  const reminderCount = reminders.length;
  const serviceCount = serviceLogs.length;

  const featuredVehicle = useMemo(
    () => vehicles.length > 0 ? vehicles[0] : null,
    [vehicles],
  );

  const locale = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text variant="labelLarge" style={styles.eyebrow}>
            {t('homeScreen.eyebrow')}
          </Text>
          <Text variant="headlineMedium" style={[styles.greeting, { color: colors.onBackground }]}>
            {t('homeScreen.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subGreeting, { color: colors.onSurfaceVariant }]}
          >
            {t('homeScreen.subtitle')}
          </Text>

          <View style={styles.summaryRow}> 
            <View style={[styles.summaryBadge, { borderColor: Colors.primary }]}> 
              <Text variant="headlineSmall" style={[styles.summaryBadgeValue, { color: Colors.primary }]}> 
                {reminderCount}
              </Text>
              <Text variant="bodySmall" style={[styles.summaryBadgeLabel, { color: colors.onSurfaceVariant }]}> 
                Pengingat
              </Text>
            </View>
            <View style={[styles.summaryBadge, { borderColor: Colors.secondary }]}> 
              <Text variant="headlineSmall" style={[styles.summaryBadgeValue, { color: Colors.secondary }]}> 
                {serviceCount}
              </Text>
              <Text variant="bodySmall" style={[styles.summaryBadgeLabel, { color: colors.onSurfaceVariant }]}> 
                Servis
              </Text>
            </View>
            <View style={[styles.summaryBadge, { borderColor: Colors.success }]}> 
              <Text variant="headlineSmall" style={[styles.summaryBadgeValue, { color: Colors.success }]}> 
                {vehicles.length}
              </Text>
              <Text variant="bodySmall" style={[styles.summaryBadgeLabel, { color: colors.onSurfaceVariant }]}> 
                Kendaraan
              </Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [
      colors.onBackground,
      colors.onSurface,
      colors.onSurfaceVariant,
      isDark,
      i18n.resolvedLanguage,
      t,
      urgentVehicles,
      vehicles.length,
      reminderCount,
      serviceCount,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {listHeader}

        {/* Pengingat Mendatang Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Pengingat Mendatang
            </Text>
            <Pressable onPress={() => navigation.navigate('Main', { screen: 'History' })}>
              <Text style={[styles.linkText, { color: Colors.primary }]}>Lihat Detail</Text>
            </Pressable>
          </View>
          
          {nextReminder ? (
            <View style={[styles.reminderDetailCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <View style={styles.reminderHeader}>
                <MaterialCommunityIcons name="wrench" size={20} color={Colors.secondary} />
                <Text variant="bodySmall" style={[styles.reminderServiceType, { color: colors.onBackground }]}>
                  {nextReminder.serviceType}
                </Text>
              </View>

              <View style={styles.reminderVehicle}>
                <MaterialCommunityIcons name="car" size={18} color={Colors.primary} />
                <Text variant="bodySmall" style={[styles.reminderVehicleInfo, { color: colors.onBackground }]}>
                  {nextReminder.vehicleName}
                </Text>
              </View>

              <View style={styles.reminderItem}>
                <View style={styles.reminderLabel}>
                  <Text variant="labelSmall" style={[{ color: colors.onSurfaceVariant }]}>
                    Tanggal Pengingat
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.cardInfo, { color: colors.onBackground }]}>
                  {new Date(nextReminder.reminderDate).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {nextReminder.note ? (
                <View style={styles.reminderItem}>
                  <View style={styles.reminderLabel}>
                    <Text variant="labelSmall" style={[{ color: colors.onSurfaceVariant }]}>
                      Catatan
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={[styles.cardInfo, { color: colors.onBackground }]}>
                    {nextReminder.note}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>Belum Ada Pengingat</Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>Tambah pengingat untuk melihatnya di sini</Text>
            </View>
          )}
        </View>

        {/* Service Data Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Data Servis
            </Text>
            <Pressable onPress={() => navigation.navigate('Main', { screen: 'History' })}>
              <Text style={[styles.linkText, { color: Colors.primary }]}>Lihat Detail</Text>
            </Pressable>
          </View>
          
          {serviceCount > 0 ? (
            <View style={[styles.featuredCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <MaterialCommunityIcons name="wrench" size={20} color={Colors.secondary} />
              <View style={styles.cardContent}>
                <Text variant="labelSmall" style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>Total Servis</Text>
                <Text variant="titleSmall" style={[styles.cardValue, { color: colors.onBackground }]}>
                  {serviceCount} servis
                </Text>
                <Text variant="bodySmall" style={[styles.cardInfo, { color: colors.onSurfaceVariant }]}>
                  Bulan ini
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>Belum Ada Data Servis</Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>Tambah catatan servis untuk melihatnya di sini</Text>
            </View>
          )}
        </View>

        {/* Kendaraan Section */}
        {featuredVehicle ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
                Kendaraan
              </Text>
              <Pressable onPress={() => navigation.navigate('VehiclesList')}>
                <Text style={[styles.linkText, { color: Colors.primary }]}>Lihat Semua</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.vehicleRow, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}
              onPress={() => handleVehiclePress(featuredVehicle)}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.08)' }}
            >
              <View style={[styles.vehicleIconBox, { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight }]}> 
                <MaterialCommunityIcons
                  name={VEHICLE_TYPE_ICONS[featuredVehicle.type] ?? 'car'}
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.vehicleTextContent}>
                <Text variant="titleMedium" style={[styles.vehicleNameSimple, { color: colors.onBackground }]}> 
                  {featuredVehicle.name}
                </Text>
                <Text variant="bodySmall" style={[styles.vehicleKmSimple, { color: colors.onSurfaceVariant }]}> 
                  {featuredVehicle.currentKm.toLocaleString(locale)} km
                </Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sectionContainer}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Kendaraan
            </Text>
            <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>Belum Ada Kendaraan</Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>Tambah kendaraan untuk memulai</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <FAB.Group
        visible={true}
        open={fabOpen}
        icon={fabOpen ? 'close' : 'plus'}
        backdropColor="transparent"
        actions={[
          {
            icon: 'speedometer',
            label: 'Perbarui Odometer',
            onPress: handleUpdateOdometer,
            color: Colors.black,
            style: [styles.actionButton, { backgroundColor: Colors.primaryLight }],
            labelStyle: { 
              backgroundColor: Colors.primaryLight, 
              color: Colors.black,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 13,
            },
          },
          {
            icon: 'bell-alert',
            label: 'Tambah Pengingat',
            onPress: handleAddReminder,
            color: Colors.white,
            style: [styles.actionButton, { backgroundColor: Colors.primaryDark }],
            labelStyle: { 
              backgroundColor: Colors.primaryDark, 
              color: Colors.white,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 13,
            },
          },
          {
            icon: 'wrench',
            label: 'Tambah Servis',
            onPress: handleAddService,
            color: Colors.white,
            style: [styles.actionButton, { backgroundColor: Colors.warning }],
            labelStyle: { 
              backgroundColor: Colors.warning, 
              color: Colors.white,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 13,
            },
          },
          {
            icon: 'car',
            label: 'Tambah Kendaraan',
            onPress: handleAddVehicle,
            color: Colors.white,
            style: [styles.actionButton, { backgroundColor: Colors.primary }],
            labelStyle: { 
              backgroundColor: Colors.primary, 
              color: Colors.white,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 20,
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 13,
            },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        onPress={() => {
          if (fabOpen) {
            setFabOpen(false);
          }
        }}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        color={Colors.primary}
      />

      <Snackbar visible={Boolean(error)} onDismiss={clearError} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar
        visible={Boolean(successMessage)}
        onDismiss={clearSuccessMessage}
        duration={2800}
      >
        {successMessage}
      </Snackbar>
      <Snackbar
        visible={Boolean(reminderSnackbar)}
        onDismiss={() => setReminderSnackbar('')}
        duration={2800}
      >
        {reminderSnackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.lg,
  },
  eyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  subGreeting: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  summaryBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  summaryBadgeValue: {
    fontFamily: 'Poppins_700Bold',
  },
  summaryBadgeLabel: {
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  linkText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  reminderDetailCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reminderServiceType: {
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  reminderVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reminderVehicleInfo: {
    fontFamily: 'Poppins_500Medium',
  },
  reminderItem: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  reminderLabel: {
    marginBottom: Spacing.xs,
  },
  reminderProgressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  reminderProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  featuredCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  cardValue: {
    fontFamily: 'Poppins_600SemiBold',
  },
  cardInfo: {
    fontFamily: 'Poppins_400Regular',
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  separator: {
    height: Spacing.md,
  },
  actionButton: {
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    marginVertical: -2,
    height: 40,
    width: 40,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleTextContent: {
    flex: 1,
  },
  vehicleNameSimple: {
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleKmSimple: {
    fontFamily: 'Poppins_400Regular',
  },
});
