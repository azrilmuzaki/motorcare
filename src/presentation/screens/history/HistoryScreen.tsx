import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { useServiceLogStore } from '@presentation/store/serviceLog.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    fetchVehicles,
    vehicles,
    isLoading: vehiclesLoading,
    error: vehicleError,
    clearError: clearVehicleError,
  } = useVehicleStore();
  const {
    logs,
    isLoading: logsLoading,
    error: logsError,
    clearError: clearLogsError,
    fetchLogs,
    deleteLog,
  } = useServiceLogStore();
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const openSwipeableIdRef = useRef<string | null>(null);
  const error = logsError ?? vehicleError;

  const refreshHistory = useCallback(() => {
    if (!user?.id) return;
    Promise.allSettled([
      fetchVehicles(user.id),
      fetchLogs(user.id),
    ]).catch(() => undefined);
  }, [fetchLogs, fetchVehicles, user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  const latestLog = useMemo(() => logs[0] ?? null, [logs]);

  const handleDelete = useCallback(async (id: string) => {
    if (openSwipeableIdRef.current === id) {
      openSwipeableRef.current?.close();
      openSwipeableRef.current = null;
      openSwipeableIdRef.current = null;
    }
    try {
      await deleteLog(id);
    } catch {
      // Store rollback and error handling are managed in the zustand store.
    }
  }, [deleteLog]);

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

  const handleDismissError = useCallback(() => {
    clearLogsError();
    clearVehicleError();
  }, [clearLogsError, clearVehicleError]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>

            {/* ── Hero full-width, melengkung di bawah ── */}
            <View style={[styles.hero, { paddingTop: insets.top + Spacing.xl }]}>
              {/* Dekorasi lingkaran */}
              <View style={styles.heroDeco1} />
              <View style={styles.heroDeco2} />

              {/* Badge
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🔧  {t('historyScreen.eyebrow')}</Text>
              </View> */}

              {/* Title & subtitle */}
              <Text style={styles.heroTitle}>{t('historyScreen.title')}</Text>
              <Text style={styles.heroSub}>{t('historyScreen.subtitle')}</Text>

              {/* Stat Cards */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{logs.length}</Text>
                  <Text style={styles.statLabel}>{t('historyScreen.totalHistory')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{vehicles.length}</Text>
                  <Text style={styles.statLabel}>{t('historyScreen.activeVehicles')}</Text>
                </View>
              </View>

              {/* Latest service pill */}
              {latestLog ? (
                <View style={styles.latestPill}>
                  <MaterialCommunityIcons name="calendar-check" size={15} color="#B5D4F4" />
                  <Text style={styles.latestText} numberOfLines={1}>
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

            {/* ── Section title ── */}
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              {t('historyScreen.sectionTitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          vehiclesLoading || logsLoading ? null : (
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
          logs.length === 0 ? styles.listEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={vehiclesLoading || logsLoading}
            onRefresh={refreshHistory}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />

      <Snackbar visible={Boolean(error)} onDismiss={handleDismissError} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Hero full-width ───────────────────────────────
  hero: {
    backgroundColor: '#185FA5',
    // Sudut atas: 0 (rata), sudut bawah: 32 (melengkung)
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  heroDeco1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -40,
  },
  heroDeco2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    right: 60,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B5D4F4',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 30,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
  },

  // ── Stat Cards ────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.md,
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // ── Latest Pill ───────────────────────────────────
  latestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  latestText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Section ───────────────────────────────────────
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: Spacing.lg,
  },

  list: {
    paddingBottom: 100,
    // Tidak ada paddingHorizontal di sini —
    // hero mentok tepi, konten list pakai padding sendiri
  },
  listEmpty: {
    flex: 1,
  },
});