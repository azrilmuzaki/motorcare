import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getDateFnsLocale } from '@core/utils/i18n.utils';
import type { ServiceLog } from '@domain/types/serviceLog.types';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { HistoryCard } from '@presentation/components/history/HistoryCard';
import { useTheme } from '@presentation/hooks/useTheme';
import type { RootStackParamList } from '@presentation/navigation/types';
import { useAuthStore } from '@presentation/store/auth.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    fetchVehicles,
    vehicles,
    serviceHistory,
    isLoading,
    markingVehicleId,
    error,
    clearError,
    fetchServiceHistory,
    removeHistory,
  } = useVehicleStore();
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const openSwipeableIdRef = useRef<string | null>(null);

  const refreshHistory = useCallback(() => {
    if (!user?.id) {
      return;
    }

    Promise.allSettled([
      fetchVehicles(user.id),
      fetchServiceHistory(user.id),
    ]).catch(() => undefined);
  }, [fetchServiceHistory, fetchVehicles, user?.id]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const latestLog = useMemo(() => serviceHistory[0] ?? null, [serviceHistory]);

  const handleDelete = useCallback(async (id: string) => {
    if (openSwipeableIdRef.current === id) {
      openSwipeableRef.current?.close();
      openSwipeableRef.current = null;
      openSwipeableIdRef.current = null;
    }

    try {
      await removeHistory(id);
    } catch {
      // Store rollback and error handling are managed in the zustand store.
    }
  }, [removeHistory]);

  const handleSwipeableOpen = useCallback((id: string, ref: Swipeable | null) => {
    if (openSwipeableIdRef.current && openSwipeableIdRef.current !== id) {
      openSwipeableRef.current?.close();
    }

    openSwipeableRef.current = ref;
    openSwipeableIdRef.current = id;
  }, []);

  const handleSwipeableClose = useCallback((id: string) => {
    if (openSwipeableIdRef.current === id) {
      openSwipeableRef.current = null;
      openSwipeableIdRef.current = null;
    }
  }, []);

  const renderItem = useCallback<ListRenderItem<ServiceLog>>(
    ({ item }) => (
      <HistoryCard
        item={item}
        onDelete={handleDelete}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableClose={handleSwipeableClose}
      />
    ),
    [handleDelete, handleSwipeableClose, handleSwipeableOpen],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={serviceHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.hero,
                { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
              ]}
            >
              <Text variant="labelLarge" style={styles.eyebrow}>
                {t('historyScreen.eyebrow')}
              </Text>
              <Text variant="headlineSmall" style={[styles.title, { color: colors.onBackground }]}>
                {t('historyScreen.title')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
              >
                {t('historyScreen.subtitle')}
              </Text>

              <View style={styles.heroStats}>
                <View style={[styles.heroStat, { backgroundColor: colors.surface }]}>
                  <Text variant="headlineSmall" style={styles.heroValue}>
                    {serviceHistory.length}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[styles.heroLabel, { color: colors.onSurfaceVariant }]}
                  >
                    {t('historyScreen.totalHistory')}
                  </Text>
                </View>
                <View style={[styles.heroStat, { backgroundColor: colors.surface }]}>
                  <Text variant="headlineSmall" style={styles.heroValue}>
                    {vehicles.length}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[styles.heroLabel, { color: colors.onSurfaceVariant }]}
                  >
                    {t('historyScreen.activeVehicles')}
                  </Text>
                </View>
              </View>

              {latestLog ? (
                <View style={[styles.latestPill, { backgroundColor: colors.surface }]}>
                  <MaterialCommunityIcons name="calendar-check" size={18} color={Colors.primary} />
                  <Text
                    variant="bodySmall"
                    style={[styles.latestText, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {t('historyScreen.latestService', {
                      vehicle: latestLog.vehicleName,
                      date: format(new Date(latestLog.serviceDate), 'dd MMM yyyy', {
                        locale: getDateFnsLocale(
                          (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id',
                        ),
                      }),
                    })}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              {t('historyScreen.sectionTitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="history"
              title={t('historyScreen.emptyTitle')}
              description={t('historyScreen.emptyDescription')}
              actionLabel={vehicles.length === 0 ? t('historyScreen.emptyAction') : undefined}
              onAction={vehicles.length === 0 ? () => navigation.navigate('AddVehicle') : undefined}
            />
          )
        }
        contentContainerStyle={[
          styles.list,
          serviceHistory.length === 0 ? styles.listEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !markingVehicleId}
            onRefresh={refreshHistory}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />

      <Snackbar visible={Boolean(error)} onDismiss={clearError} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  heroStat: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  heroValue: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  heroLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  latestPill: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  latestText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
});
