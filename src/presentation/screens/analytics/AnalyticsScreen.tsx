import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@presentation/components/common/AppCard';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { ServiceChart } from '@presentation/components/analytics/ServiceChart';
import { useServiceLogs } from '@presentation/hooks/useServiceLogs';
import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getIntlLocale } from '@core/utils/i18n.utils';
import { useTheme } from '@presentation/hooks/useTheme';

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function getMonthLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: 'short' });
}

function buildRecentMonths(locale: string, count = 6) {
  const months: { label: string; key: string }[] = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({ label: getMonthLabel(date, locale), key: getMonthKey(date) });
  }

  return months;
}

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const { logs, isLoading, refresh } = useServiceLogs();
  const locale = getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id');

  const recentMonths = useMemo(() => buildRecentMonths(locale), [locale]);

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};

    logs.forEach((log) => {
      const logDate = new Date(log.serviceDate);
      const key = getMonthKey(logDate);
      counts[key] = (counts[key] ?? 0) + 1;
    });

    return recentMonths.map((month) => ({
      label: month.label,
      value: counts[month.key] ?? 0,
      color: Colors.primary,
    }));
  }, [logs, recentMonths]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};

    logs.forEach((log) => {
      const type = log.serviceType || 'Servis Lain';
      counts[type] = (counts[type] ?? 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, value], index) => ({
        label,
        value,
        color: [Colors.primary, Colors.secondary, Colors.warning, Colors.success][index % 4],
      }));
  }, [logs]);

  const totalServices = logs.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={[styles.hero, { backgroundColor: colors.surface }]}> 
        <Text variant="labelLarge" style={styles.eyebrow}>Statistik Servis</Text>
        <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>Grafik perawatan kendaraan</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Lihat jumlah servis per bulan dan jenis servis yang sering dilakukan.</Text>
      </View>

      <ServiceChart
        title="Servis per Bulan"
        subtitle="6 bulan terakhir"
        data={monthlyData}
      />

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text variant="labelMedium" style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Total Servis</Text>
            <Text variant="headlineSmall" style={[styles.summaryValue, { color: colors.onBackground }]}>{totalServices}</Text>
          </View>
          <View>
            <Text variant="labelMedium" style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Jenis Servis Populer</Text>
            <Text variant="bodySmall" style={[styles.summaryNote, { color: colors.onSurfaceVariant }]}>{typeData.length > 0 ? typeData[0].label : 'Belum ada data'}</Text>
          </View>
        </View>
      </AppCard>

      {typeData.length > 0 ? (
        <ServiceChart title="Jenis Servis" data={typeData} />
      ) : (
        <EmptyState
          icon="chart-bar"
          title="Belum ada data servis"
          description="Tambahkan riwayat servis agar grafik dapat ditampilkan di sini."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  eyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  summaryLabel: {
    fontFamily: 'Poppins_500Medium',
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    marginTop: Spacing.xs,
  },
  summaryNote: {
    fontFamily: 'Poppins_500Medium',
    marginTop: Spacing.xs,
  },
});
