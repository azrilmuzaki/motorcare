import React, { memo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Chip, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { Colors } from '@core/theme/colors';
import { BorderRadius, FontSizes, Spacing } from '@core/theme/typography';
import { getIntlLocale, translateServiceType, translateVehicleType } from '@core/utils/i18n.utils';
import { getServiceStatus } from '@domain/logic/vehicle.logic';
import { ServiceStatus, Vehicle } from '@domain/types/vehicle.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { useTheme } from '@presentation/hooks/useTheme';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  onMarkAsServiced?: () => void;
  onUpdateOdometer?: () => void;
  isMarkingServiced?: boolean;
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  ok: Colors.success,
  warning: Colors.warning,
  urgent: Colors.secondary,
  overdue: Colors.error,
};

const SERVICE_TYPE_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  'ganti oli': 'oil',
  'servis rutin': 'wrench-check',
  'ganti ban': 'tire',
  'tune up': 'engine',
};

function getServiceTypeIcon(serviceType: string) {
  return SERVICE_TYPE_ICONS[serviceType.toLowerCase()] ?? 'wrench-cog';
}

export const VehicleCard = memo<VehicleCardProps>(({
  vehicle,
  onPress,
  onMarkAsServiced,
  onUpdateOdometer,
  isMarkingServiced = false,
}) => {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const remainingKm = vehicle.remainingKm ?? 0;
  const estimatedDays = vehicle.estimatedDays ?? 0;
  const status = getServiceStatus(remainingKm);
  const statusColor = STATUS_COLORS[status];
  const typeIcon = VEHICLE_TYPE_ICONS[vehicle.type];
  const serviceIcon = getServiceTypeIcon(vehicle.serviceType);
  const locale = getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id');
  const serviceTypeLabel = translateServiceType(t, vehicle.serviceType);
  const progress = Math.max(
    0,
    Math.min(
      100,
      ((vehicle.targetInterval - remainingKm) / Math.max(vehicle.targetInterval, 1)) * 100,
    ),
  );

  return (
    <AppCard onPress={onPress}>
      <View style={styles.header}>
        {onUpdateOdometer ? (
          <Pressable
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight },
            ]}
            onPress={onUpdateOdometer}
            android_ripple={{ color: 'rgba(36, 107, 253, 0.12)', borderless: true }}
          >
            <MaterialCommunityIcons name={typeIcon} size={24} color={Colors.primary} />
          </Pressable>
        ) : (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight },
            ]}
          >
            <MaterialCommunityIcons name={typeIcon} size={24} color={Colors.primary} />
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text variant="titleMedium" style={styles.vehicleName} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.vehicleType, { color: colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {translateVehicleType(t, vehicle.type)} | {serviceTypeLabel}
          </Text>
        </View>

        <Chip
          compact
          style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}
          textStyle={[styles.statusText, { color: statusColor }]}
        >
          {t(`vehicle.status.${status}`)}
        </Chip>
      </View>

      <View
        style={[
          styles.heroPanel,
          { backgroundColor: isDark ? Colors.dark.surfaceVariant : Colors.light.surfaceVariant },
        ]}
      >
        <View style={styles.heroCopy}>
          <Text
            variant="labelMedium"
            style={[styles.heroLabel, { color: colors.onSurfaceVariant }]}
          >
            {serviceTypeLabel}
          </Text>
          <Text variant="headlineSmall" style={[styles.heroValue, { color: statusColor }]}>
            {remainingKm.toLocaleString(locale)} km
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.heroNote, { color: colors.onSurfaceVariant }]}
          >
            {estimatedDays > 0
              ? t('vehicleCard.daysRemaining', { count: estimatedDays })
              : t('vehicleCard.checkSoon')}
          </Text>
        </View>

        <View style={[styles.heroBadge, { backgroundColor: `${statusColor}16` }]}>
          <MaterialCommunityIcons name={serviceIcon} size={20} color={statusColor} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text
            variant="labelSmall"
            style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
          >
            {t('vehicleCard.currentKm')}
          </Text>
          <Text variant="titleMedium" style={styles.statValue}>
            {vehicle.currentKm.toLocaleString(locale)} km
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? Colors.dark.outline : Colors.light.outline },
          ]}
        />

        <View style={styles.stat}>
          <Text
            variant="labelSmall"
            style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
          >
            {t('vehicleCard.targetInterval')}
          </Text>
          <Text variant="titleMedium" style={styles.statValue}>
            {vehicle.targetInterval.toLocaleString(locale)} km
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text
          variant="labelSmall"
          style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}
        >
          {t('vehicleCard.progress')}
        </Text>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? Colors.dark.outline : Colors.light.divider },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>

        <View style={styles.progressMeta}>
          <Text
            variant="labelSmall"
            style={[styles.progressText, { color: colors.onSurfaceVariant }]}
          >
            0 km
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.progressText, { color: colors.onSurfaceVariant }]}
          >
            {vehicle.targetInterval.toLocaleString(locale)} km
          </Text>
        </View>
      </View>

      {onMarkAsServiced ? (
        <View style={styles.actions}>
          <AppButton
            label={t('vehicleCard.markAsServiced')}
            onPress={onMarkAsServiced}
            loading={isMarkingServiced}
            disabled={isMarkingServiced}
            icon="check-circle-outline"
            variant="outlined"
            style={styles.actionButton}
          />
        </View>
      ) : null}
    </AppCard>
  );
});

VehicleCard.displayName = 'VehicleCard';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleType: {
    fontFamily: 'Poppins_400Regular',
  },
  statusChip: {
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: FontSizes.xs,
  },
  heroPanel: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  heroValue: {
    fontFamily: 'Poppins_700Bold',
  },
  heroNote: {
    fontFamily: 'Poppins_400Regular',
  },
  heroBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Poppins_600SemiBold',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: Spacing.sm,
  },
  progressContainer: {
    gap: 2,
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
  actions: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    borderRadius: BorderRadius.full,
    minWidth: 140,
  },
});
