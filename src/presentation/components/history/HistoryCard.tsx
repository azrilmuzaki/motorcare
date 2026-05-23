import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getDateFnsLocale } from '@core/utils/i18n.utils';
import type { ServiceLog } from '@domain/types/serviceLog.types';
import { useTheme } from '@presentation/hooks/useTheme';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';

interface HistoryCardProps {
  item: ServiceLog;
  onDelete: (id: string) => void;
  onSwipeableOpen: (id: string, ref: Swipeable | null) => void;
  onSwipeableClose: (id: string) => void;
}

export const HistoryCard = memo<HistoryCardProps>(({
  item,
  onDelete,
  onSwipeableOpen,
  onSwipeableClose,
}) => {
  const swipeableRef = useRef<Swipeable | null>(null);
  const { colors, isDark } = useTheme();
  const { i18n, t } = useTranslation();

  const language = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';

  const formattedDate = useMemo(
    () =>
      format(new Date(item.serviceDate), 'dd MMM yyyy', {
        locale: getDateFnsLocale(language),
      }),
    [item.serviceDate, language],
  );

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleSwipeableOpen = useCallback(() => {
    onSwipeableOpen(item.id, swipeableRef.current);
  }, [item.id, onSwipeableOpen]);

  const handleSwipeableClose = useCallback(() => {
    onSwipeableClose(item.id);
  }, [item.id, onSwipeableClose]);

  const typeIcon = VEHICLE_TYPE_ICONS[item.vehicleType as any] || 'car';

  const renderRightActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [-120, -40, 0],
        outputRange: [0, 12, 24],
        extrapolate: 'clamp',
      });

      const scale = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.92, 0.97, 1],
        extrapolate: 'clamp',
      });

      const opacity = progress.interpolate({
        inputRange: [0, 0.25, 1],
        outputRange: [0.55, 0.8, 1],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[
            styles.rightActionWrapper,
            {
              opacity,
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          <RectButton style={styles.deleteButton} onPress={handleDelete}>
            <MaterialCommunityIcons name="delete" size={24} color={Colors.white} />
            <Text variant="labelLarge" style={styles.deleteText}>
              {t('common.delete', 'Delete')}
            </Text>
          </RectButton>
        </Animated.View>
      );
    },
    [handleDelete, t],
  );

  return (
    <View style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        overshootRight={false}
        rightThreshold={32}
        containerStyle={styles.swipeableContainer}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableClose={handleSwipeableClose}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
              borderColor: isDark ? Colors.dark.outline : Colors.light.outline,
              shadowOpacity: isDark ? 0.26 : 0.08,
            },
          ]}
        >
          <View style={styles.cardInner}>
            {/* Left: Icon box */}
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.background : Colors.primaryLight }]}>
              <MaterialCommunityIcons name={typeIcon as any} size={24} color={Colors.primary} />
            </View>

            {/* Middle: Details */}
            <View style={styles.details}>
              <Text variant="titleMedium" style={[styles.vehicleName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.vehicleName}
              </Text>
              
              {/* Notes/Service description */}
              {item.notes ? (
                <Text variant="bodyMedium" style={[styles.serviceNotes, { color: colors.onSurface }]} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : (
                <Text variant="bodyMedium" style={[styles.serviceNotes, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {item.serviceType || 'Servis Rutin'}
                </Text>
              )}

              {/* Date Row */}
              <View style={styles.dateRow}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={14}
                  color={colors.onSurfaceVariant}
                />
                <Text variant="bodySmall" style={[styles.serviceDate, { color: colors.onSurfaceVariant }]}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {/* Right: Mileage Badge */}
            <View style={styles.rightSection}>
              <View style={[styles.kmBadge, { backgroundColor: isDark ? colors.background : Colors.primaryLight }]}>
                <Text style={[styles.kmBadgeText, { color: Colors.primary }]}>
                  {item.serviceKm.toLocaleString(language)} km
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    </View>
  );
});

HistoryCard.displayName = 'HistoryCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  swipeableContainer: {
    borderRadius: BorderRadius.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  vehicleName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 20,
  },
  serviceNotes: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceDate: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 14,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  kmBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  kmBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  rightActionWrapper: {
    width: 96,
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  deleteText: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
});
