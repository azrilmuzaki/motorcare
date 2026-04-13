import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';

export interface ServiceChartItem {
  label: string;
  value: number;
  color?: string;
}

interface ServiceChartProps {
  title: string;
  subtitle?: string;
  data: ServiceChartItem[];
  maxValue?: number;
}

export function ServiceChart({ title, subtitle, data, maxValue }: ServiceChartProps) {
  const { colors } = useTheme();
  const safeMax = Math.max(maxValue ?? Math.max(...data.map(item => item.value), 1), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}> 
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: Colors.primaryLight }]}> 
          <MaterialCommunityIcons name="chart-bar" size={18} color={Colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text variant="titleMedium" style={[styles.title, { color: colors.onBackground }]}> {title} </Text>
          {subtitle ? (
            <Text variant="bodySmall" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}> 
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.chart}> 
        {data.map((item) => {
          const percent = safeMax > 0 ? Math.round((item.value / safeMax) * 100) : 0;
          return (
            <View key={item.label} style={styles.row}>
              <Text variant="bodySmall" style={[styles.label, { color: colors.onSurfaceVariant }]}> {item.label} </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${percent}%`,
                      backgroundColor: item.color ?? Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text variant="labelSmall" style={[styles.value, { color: colors.onSurfaceVariant }]}> {item.value} </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
  },
  chart: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    width: 50,
    fontFamily: 'Poppins_500Medium',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.outline,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  value: {
    width: 24,
    textAlign: 'right',
    fontFamily: 'Poppins_500Medium',
  },
});
