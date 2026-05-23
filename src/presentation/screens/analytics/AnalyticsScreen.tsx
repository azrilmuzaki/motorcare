import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Text as SvgText, Polygon, Polyline } from 'react-native-svg';

import { AppCard } from '@presentation/components/common/AppCard';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useServiceLogs } from '@presentation/hooks/useServiceLogs';
import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getIntlLocale } from '@core/utils/i18n.utils';
import { useTheme } from '@presentation/hooks/useTheme';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function getMonthLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: 'short' });
}

function buildRecentMonths(locale: string, count = 6) {
  const months: { label: string; key: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: getMonthLabel(date, locale), key: getMonthKey(date) });
  }
  return months;
}

const CHART_COLORS = ['#185FA5', '#1D9E75', '#D85A30', '#888780'];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated bar chart (bar mode) */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const BAR_HEIGHT = 100;

  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      anims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: data[i].value / maxVal,
          useNativeDriver: false,
          damping: 14,
          stiffness: 120,
        })
      )
    ).start();
  }, [data]);

  return (
    <View style={barStyles.container}>
      {data.map((d, i) => (
        <View key={d.label} style={barStyles.col}>
          <Text style={barStyles.value}>{d.value}</Text>
          <View style={[barStyles.barBg, { height: BAR_HEIGHT }]}>
            <Animated.View
              style={[
                barStyles.bar,
                {
                  height: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, BAR_HEIGHT],
                  }),
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  opacity: anims[i].interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0, 1, 1],
                  }),
                },
              ]}
            />
          </View>
          <Text style={barStyles.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barBg: {
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 6,
    backgroundColor: 'rgba(24,95,165,0.07)',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    color: '#888780',
    fontFamily: 'Poppins_500Medium',
  },
  value: {
    fontSize: 10,
    color: '#185FA5',
    fontFamily: 'Poppins_600SemiBold',
  },
});

/** Line/trend chart using react-native-svg */
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const W = Dimensions.get('window').width - 32 - 32;
  const H = 100;
  const PAD = 12;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const xs = data.map((_, i) => PAD + i * ((W - PAD * 2) / (data.length - 1)));
  const ys = data.map((d) => H - PAD - (d.value / maxVal) * (H - PAD * 2));

  const polyPoints = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const areaPoints = `${xs[0]},${H} ${polyPoints} ${xs[xs.length - 1]},${H}`;

  return (
    <Svg width={W} height={H}>
      <Polygon points={areaPoints} fill="rgba(24,95,165,0.10)" />
      <Polyline
        points={polyPoints}
        fill="none"
        stroke="#185FA5"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {xs.map((x, i) => (
        <React.Fragment key={i}>
          <Circle cx={x} cy={ys[i]} r={4} fill="#185FA5" />
          <SvgText
            x={x}
            y={H - 1}
            fontSize={9}
            fill="#888780"
            textAnchor="middle"
            fontFamily="Poppins_500Medium"
          >
            {data[i].label}
          </SvgText>
          <SvgText
            x={x}
            y={ys[i] - 8}
            fontSize={9}
            fill="#185FA5"
            textAnchor="middle"
            fontFamily="Poppins_600SemiBold"
          >
            {data[i].value}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

/** Donut chart using react-native-svg */
function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const SIZE = 110;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 44;
  const INNER = 27;
  const total = data.reduce((s, d) => s + d.value, 0);

  const slices: { d: string; color: string }[] = [];
  let angle = -Math.PI / 2;

  data.forEach((item) => {
    const slice = (item.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + slice);
    const y2 = cy + R * Math.sin(angle + slice);
    const ix1 = cx + INNER * Math.cos(angle);
    const iy1 = cy + INNER * Math.sin(angle);
    const ix2 = cx + INNER * Math.cos(angle + slice);
    const iy2 = cy + INNER * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    slices.push({
      d: `M${ix1},${iy1} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${INNER},${INNER} 0 ${large},0 ${ix1},${iy1} Z`,
      color: item.color,
    });
    angle += slice;
  });

  return (
    <Svg width={SIZE} height={SIZE}>
      {slices.map((s, i) => (
        <Path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth={2} />
      ))}
      <SvgText
        x={cx}
        y={cy - 3}
        fontSize={16}
        fontWeight="bold"
        fill="#185FA5"
        textAnchor="middle"
        fontFamily="Poppins_700Bold"
      >
        {total}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 12}
        fontSize={8}
        fill="#888780"
        textAnchor="middle"
        fontFamily="Poppins_400Regular"
      >
        total
      </SvgText>
    </Svg>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const { logs, isLoading, refresh } = useServiceLogs();
  const locale = getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id');

  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');

  const recentMonths = useMemo(() => buildRecentMonths(locale), [locale]);

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const key = getMonthKey(new Date(log.serviceDate));
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return recentMonths.map((m) => ({ label: m.label, value: counts[m.key] ?? 0 }));
  }, [logs, recentMonths]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const type = log.serviceType || 'Lainnya';
      counts[type] = (counts[type] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, value], i) => ({ label, value, color: CHART_COLORS[i % 4] }));
  }, [logs]);

  const totalServices = logs.length;
  const topService = typeData[0]?.label ?? 'Belum ada data';
  const topCount = typeData[0]?.value ?? 0;

  const lastTwo = monthlyData.slice(-2);
  const growthThisMonth =
    lastTwo.length === 2 ? lastTwo[1].value - lastTwo[0].value : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero full-width dengan curved bottom ── */}
      <View style={[styles.hero, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
        {/* <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>📊  Statistik Servis</Text>
        </View> */}
        <Text style={styles.heroTitle}>Grafik perawatan{'\n'}kendaraan Anda</Text>
        <Text style={styles.heroSub}>
          Pantau riwayat servis dan jenis perawatan yang paling sering dilakukan.
        </Text>

        {/* Stats box di dalam hero */}
        <View style={styles.heroStatsBox}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Total servis</Text>
            <Text style={styles.heroStatValue}>{totalServices}</Text>
            {growthThisMonth !== 0 && (
              <View style={styles.growthBadge}>
                <Text style={styles.growthBadgeText}>
                  {growthThisMonth > 0 ? '+' : ''}{growthThisMonth} bulan ini
                </Text>
              </View>
            )}
          </View>

          <View style={styles.heroStatDivider} />

          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Servis terpopuler</Text>
            <Text style={styles.heroStatValueSm} numberOfLines={1}>{topService}</Text>
            <Text style={styles.heroStatSub}>{topCount} dari {totalServices} servis</Text>
          </View>
        </View>
      </View>

      {/* ── Monthly Chart ── */}
      <AppCard style={[styles.card, { backgroundColor: colors.surface, marginHorizontal: Spacing.lg }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.onBackground }]}>Servis per bulan</Text>
            <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>6 bulan terakhir</Text>
          </View>
          <View style={styles.toggleRow}>
            {(['bar', 'line'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setChartMode(mode)}
                style={[
                  styles.toggleChip,
                  chartMode === mode && styles.toggleChipActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleChipText,
                    chartMode === mode && styles.toggleChipTextActive,
                  ]}
                >
                  {mode === 'bar' ? 'Bar' : 'Tren'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {chartMode === 'bar' ? (
          <BarChart data={monthlyData} />
        ) : (
          <LineChart data={monthlyData} />
        )}
      </AppCard>

      {/* ── Type Distribution ── */}
      {typeData.length > 0 ? (
        <AppCard style={[styles.card, { backgroundColor: colors.surface, marginHorizontal: Spacing.lg }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.onBackground }]}>Distribusi jenis servis</Text>
              <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>Berdasarkan total kejadian</Text>
            </View>
          </View>

          <View style={styles.donutSection}>
            <DonutChart data={typeData} />
            <View style={styles.legend}>
              {typeData.map((item) => {
                const pct = Math.round((item.value / (typeData.reduce((s, d) => s + d.value, 0))) * 100);
                return (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={styles.legendText}>
                      <View style={styles.legendRow}>
                        <Text style={[styles.legendName, { color: colors.onBackground }]} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text style={[styles.legendPct, { color: colors.onSurfaceVariant }]}>{pct}%</Text>
                      </View>
                      <View style={styles.legendBarBg}>
                        <View style={[styles.legendBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </AppCard>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.lg },

  // Hero — full width, curved bottom
  hero: {
    backgroundColor: '#185FA5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 28,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
  },

  // Hero Stats Box
  heroStatsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    gap: 4,
  },
  heroStatDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: Spacing.md,
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatValue: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  heroStatValueSm: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    marginTop: 4,
  },
  heroStatSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  growthBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF3DE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  growthBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#3B6D11',
  },

  // Cards
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  cardSub: { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  // Toggle chips
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  toggleChipActive: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  toggleChipText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#888780' },
  toggleChipTextActive: { color: '#fff' },

  // Donut
  donutSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  legendText: { flex: 1 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendName: { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  legendPct: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  legendBarBg: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  legendBarFill: { height: 3, borderRadius: 2 },
});