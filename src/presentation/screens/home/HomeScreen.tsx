import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FAB, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getIntlLocale, translateServiceType } from '@core/utils/i18n.utils';
import type { Vehicle } from '@domain/types/vehicle.types';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { VehicleCard } from '@presentation/components/vehicle/VehicleCard';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { RootStackParamList } from '@presentation/navigation/types';
import { useVehicleStore } from '@presentation/store/vehicle.store';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    vehicles,
    isLoading,
    markingVehicleId,
    error,
    successMessage,
    refresh,
    clearError,
    clearSuccessMessage,
    markAsServiced,
  } = useVehicles();

  const handleAddVehicle = useCallback(() => {
    navigation.navigate('AddVehicle');
  }, [navigation]);

  const handleVehiclePress = useCallback((vehicle: Vehicle) => {
    useVehicleStore.getState().selectVehicle(vehicle);
  }, []);

  const handleMarkAsServiced = useCallback((vehicle: Vehicle) => {
    Alert.alert(
      t('homeScreen.confirmTitle'),
      t('homeScreen.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('homeScreen.confirmAction'),
          onPress: () => {
            markAsServiced(vehicle.id).catch(() => undefined);
          },
        },
      ],
    );
  }, [markAsServiced, t]);

  const renderItem = useCallback<ListRenderItem<Vehicle>>(
    ({ item }) => (
      <VehicleCard
        vehicle={item}
        onPress={() => handleVehiclePress(item)}
        onMarkAsServiced={() => handleMarkAsServiced(item)}
        isMarkingServiced={markingVehicleId === item.id}
      />
    ),
    [handleMarkAsServiced, handleVehiclePress, markingVehicleId],
  );

  const keyExtractor = useCallback((item: Vehicle) => item.id, []);

  const urgentVehicles = useMemo(
    () => vehicles.filter(vehicle => (vehicle.remainingKm ?? 0) <= 500).length,
    [vehicles],
  );

  const nextServiceVehicle = useMemo(
    () =>
      [...vehicles].sort(
        (a, b) =>
          (a.remainingKm ?? Number.MAX_SAFE_INTEGER) - (b.remainingKm ?? Number.MAX_SAFE_INTEGER),
      )[0] ?? null,
    [vehicles],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View
          style={[
            styles.hero,
            { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
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

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
              <Text variant="headlineSmall" style={styles.metricValue}>
                {vehicles.length}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}
              >
                {t('homeScreen.activeVehicles')}
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
              <Text variant="headlineSmall" style={styles.metricValue}>
                {urgentVehicles}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}
              >
                {t('homeScreen.needsAttention')}
              </Text>
            </View>
          </View>

          {nextServiceVehicle ? (
            <View style={[styles.nextServicePill, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="wrench-clock" size={18} color={Colors.primary} />
              <Text
                variant="bodySmall"
                style={[styles.nextServiceText, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {t('homeScreen.nextService', {
                  serviceType: translateServiceType(t, nextServiceVehicle.serviceType),
                  name: nextServiceVehicle.name,
                  distance: `${(nextServiceVehicle.remainingKm ?? 0).toLocaleString(
                    getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id'),
                  )} km`,
                })}
              </Text>
            </View>
          ) : null}
        </View>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
          {t('homeScreen.sectionTitle')}
        </Text>
      </View>
    ),
    [
      colors.onBackground,
      colors.onSurface,
      colors.onSurfaceVariant,
      isDark,
      i18n.resolvedLanguage,
      nextServiceVehicle,
      t,
      urgentVehicles,
      vehicles.length,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <EmptyState
        icon="garage-open"
        title={t('homeScreen.emptyTitle')}
        description={t('homeScreen.emptyDescription')}
        actionLabel={t('homeScreen.emptyAction')}
        onAction={handleAddVehicle}
      />
    ),
    [handleAddVehicle, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={vehicles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={isLoading ? null : listEmpty}
        contentContainerStyle={[
          styles.list,
          vehicles.length === 0 ? styles.listEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !markingVehicleId}
            onRefresh={refresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FAB
        icon="plus"
        label={t('homeScreen.fabLabel')}
        onPress={handleAddVehicle}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        color={Colors.white}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.xl,
  },
  eyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greeting: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  subGreeting: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  metricValue: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  nextServicePill: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextServiceText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  separator: {
    height: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
