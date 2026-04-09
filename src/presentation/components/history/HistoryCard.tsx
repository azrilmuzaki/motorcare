import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Reanimated, {
  FadeIn,
  FadeOutLeft,
  LinearTransition,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import {
  getDateFnsLocale,
  getIntlLocale,
  translateServiceType,
} from '@core/utils/i18n.utils';
import type { ServiceLog } from '@domain/types/serviceLog.types';
import { AppCard } from '@presentation/components/common/AppCard';
import { useTheme } from '@presentation/hooks/useTheme';

type SwipeableInstance = Swipeable | null;

const SERVICE_TYPE_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  'ganti oli': 'oil',
  'servis rutin': 'wrench-check',
  'ganti ban': 'tire',
  'tune up': 'engine',
};

function getServiceIcon(serviceType: string) {
  return SERVICE_TYPE_ICONS[serviceType.toLowerCase()] ?? 'wrench-cog';
}

interface HistoryCardProps {
  item: ServiceLog;
  onDelete: (id: string) => void;
  onSwipeableOpen: (id: string, swipeable: SwipeableInstance) => void;
  onSwipeableClose: (id: string) => void;
}

export const HistoryCard = memo<HistoryCardProps>(({
  item,
  onDelete,
  onSwipeableOpen,
  onSwipeableClose,
}) => {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const swipeableRef = useRef<Swipeable>(null);
  const serviceIcon = getServiceIcon(item.serviceType);
  const language = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';
  const locale = getIntlLocale(language);

  const formattedDate = useMemo(
    () =>
      format(new Date(item.serviceDate), 'dd MMMM yyyy', {
        locale: getDateFnsLocale(language),
      }),
    [item.serviceDate, language],
  );

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item.id);
  }, [item.id, onDelete]);

  const renderRightActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const translateX = dragX.interpolate({
        inputRange: [-110, 0],
        outputRange: [0, 42],
        extrapolate: 'clamp',
      });

      const opacity = progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.2, 0.7, 1],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[
            styles.actionWrap,
            {
              opacity,
              transform: [{ translateX }],
            },
          ]}
        >
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteAction,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="delete" size={22} color={Colors.white} />
            <Text style={styles.deleteLabel}>{t('common.remove')}</Text>
          </Pressable>
        </Animated.View>
      );
    },
    [handleDelete, t],
  );

  return (
    <Reanimated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOutLeft.duration(180)}
      layout={LinearTransition.duration(180)}
      style={styles.animatedItem}
    >
      <Swipeable
        ref={swipeableRef}
        friction={2}
        overshootRight={false}
        rightThreshold={36}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => onSwipeableOpen(item.id, swipeableRef.current)}
        onSwipeableClose={() => onSwipeableClose(item.id)}
      >
        <AppCard style={styles.logCard}>
          <View style={styles.logHeader}>
            <View
              style={[
                styles.logIcon,
                { backgroundColor: isDark ? Colors.dark.hero : Colors.successLight },
              ]}
            >
              <MaterialCommunityIcons name={serviceIcon} size={20} color={Colors.success} />
            </View>

            <View style={styles.logInfo}>
              <Text variant="titleSmall" style={styles.logVehicle}>
                {item.vehicleName}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.logServiceType, { color: colors.onSurfaceVariant }]}
              >
                {translateServiceType(t, item.serviceType)}
              </Text>
              <Text variant="bodySmall" style={[styles.logDate, { color: colors.onSurfaceVariant }]}>
                {formattedDate}
              </Text>
            </View>

            <Text variant="labelLarge" style={styles.logKm}>
              {item.serviceKm.toLocaleString(locale)} km
            </Text>
          </View>

          {item.notes ? (
            <Text
              variant="bodySmall"
              style={[styles.logNotes, { color: colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {t('historyScreen.notesPrefix')}: {item.notes}
            </Text>
          ) : null}
        </AppCard>
      </Swipeable>
    </Reanimated.View>
  );
});

HistoryCard.displayName = 'HistoryCard';

const styles = StyleSheet.create({
  animatedItem: {
    marginBottom: Spacing.sm,
  },
  actionWrap: {
    width: 108,
    height: '100%',
  },
  deleteAction: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteLabel: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  logCard: {
    marginBottom: 0,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logVehicle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  logServiceType: {
    fontFamily: 'Poppins_500Medium',
    marginBottom: 2,
  },
  logDate: {
    fontFamily: 'Poppins_400Regular',
  },
  logKm: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
  },
  logNotes: {
    marginTop: Spacing.sm,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
});
