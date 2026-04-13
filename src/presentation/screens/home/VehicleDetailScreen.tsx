import React, { useMemo, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { RootStackParamList } from '@presentation/navigation/types';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { getServiceStatus } from '@domain/logic/vehicle.logic';
import { translateServiceType } from '@core/utils/i18n.utils';

type VehicleDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

export function VehicleDetailScreen({ route }: VehicleDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { vehicles, markAsServiced, markingVehicleId, isLoading } = useVehicles();
  const { vehicleId } = route.params;

  const vehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  const status = useMemo(
    () => (vehicle ? getServiceStatus(vehicle.remainingKm ?? 0) : 'ok'),
    [vehicle],
  );

  const statusColor = useMemo(() => {
    switch (status) {
      case 'ok':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'urgent':
        return Colors.error;
      case 'overdue':
        return Colors.error;
      default:
        return Colors.primary;
    }
  }, [status]);

  const serviceTypeLabel = useMemo(
    () => (vehicle ? translateServiceType(t, vehicle.serviceType) : ''),
    [t, vehicle],
  );

  const locale = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';
  const progress = useMemo(
    () => (vehicle ? Math.max(0, Math.min(100, (vehicle.currentKm / Math.max(vehicle.targetInterval, 1)) * 100)) : 0),
    [vehicle],
  );
  const isMarkingServiced = vehicle ? markingVehicleId === vehicle.id : false;

  const handleMarkAsServiced = useCallback(() => {
    if (!vehicle) {
      return;
    }

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
  }, [markAsServiced, t, vehicle]);

if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}>
          <Text variant="titleMedium" style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>Memuat...</Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}> 
          <Text variant="titleMedium" style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>Kendaraan tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  const typeIcon = VEHICLE_TYPE_ICONS[vehicle.type] || 'car';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}> 
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight }]}> 
            <MaterialCommunityIcons name={typeIcon} size={28} color={Colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={[styles.vehicleName, { color: colors.onBackground }]}>
              {vehicle.name}
            </Text>
            {serviceTypeLabel ? (
              <Text variant="bodySmall" style={[styles.vehicleSubtitle, { color: colors.onSurfaceVariant }]}> 
                {serviceTypeLabel}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${Colors.success}16` }]}> 
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
            <Text style={[styles.statusText, { color: Colors.success }]}>{t(`vehicle.status.${status}`)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="speedometer" size={18} color={Colors.primary} />
          <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>KM Sekarang</Text>
          <Text style={[styles.detailValue, { color: colors.onBackground }]}>{vehicle.currentKm.toLocaleString(locale)} km</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="target" size={18} color={Colors.secondary} />
          <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Interval Target</Text>
          <Text style={[styles.detailValue, { color: colors.onBackground }]}>{vehicle.targetInterval.toLocaleString(locale)} km</Text>
        </View>



        <View style={styles.progressSection}>
          <Text style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>Progress Servis</Text>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? Colors.dark.outline : Colors.light.divider }]}> 
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: statusColor }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>0 km</Text>
            <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>{vehicle.targetInterval.toLocaleString(locale)} km</Text>
          </View>
        </View>

        {vehicle.estimatedDays && vehicle.estimatedDays > 0 ? (
          <Text variant="bodyMedium" style={[styles.estimateText, { color: colors.onSurfaceVariant }]}> 
            {t('vehicleCard.daysRemaining', { count: vehicle.estimatedDays })}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleMarkAsServiced}
          loading={isMarkingServiced}
          disabled={isMarkingServiced}
          contentStyle={styles.detailButtonContent}
          labelStyle={styles.detailButtonLabel}
        >
          Selesai Diservis
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: 'Poppins_700Bold',
  },
  vehicleSubtitle: {
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  detailLabel: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    marginLeft: 8,
  },
  detailValue: {
    fontFamily: 'Poppins_600SemiBold',
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: 'Poppins_400Regular',
  },
  estimateText: {
    fontFamily: 'Poppins_500Medium',
    marginTop: Spacing.sm,
  },
  detailButtonContent: {
    paddingVertical: Spacing.md,
  },
  detailButtonLabel: {
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
  },
});
