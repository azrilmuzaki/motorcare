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
          <View style={styles.content}>
            <Text variant="titleSmall" style={[styles.vehicleName, { color: colors.onSurface }]}>
              {item.vehicleName}
            </Text>

            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={[styles.serviceDate, { color: colors.onSurfaceVariant }]}>
                {formattedDate}
              </Text>
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
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3,
  },
  content: {
    gap: Spacing.xs,
  },
  vehicleName: {
    fontFamily: 'Poppins_700Bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceDate: {
    fontFamily: 'Poppins_500Medium',
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
