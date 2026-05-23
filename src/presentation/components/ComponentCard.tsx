import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import type { VehicleComponent } from '@domain/types/vehicle.types';
import { useTheme } from '@presentation/hooks/useTheme';
import { getServiceStatus } from '@domain/logic/vehicle.logic';

interface Props {
  component: VehicleComponent;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ok: Colors.success,
  warning: Colors.warning,
  urgent: Colors.secondary,
  overdue: Colors.error,
};

export function ComponentCard({ component, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';

  const remainingKm = component.remainingKm ?? 0;
  const status = getServiceStatus(remainingKm);
  const statusColor = STATUS_COLORS[status];
  
  const isOk = status === 'ok' || status === 'warning';
  const headerIcon = isOk ? 'check-circle' : 'alert-circle';
  const headerIconColor = isOk ? Colors.success : statusColor;

  // Format estimated date
  let estimatedDateStr = 'Est. -';
  if (component.estimatedDays !== undefined && component.estimatedDays > 0) {
    const date = new Date();
    date.setDate(date.getDate() + component.estimatedDays);
    estimatedDateStr = `Est. ${date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else if (component.estimatedDays !== undefined && component.estimatedDays <= 0) {
    estimatedDateStr = 'Perlu dicek';
  }

  return (
    <Pressable 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderColor: isDark ? colors.outline : colors.surfaceVariant,
        }
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      {/* Header: Status Icon & Title */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name={headerIcon} size={18} color={headerIconColor} />
        <Text variant="labelMedium" style={[styles.title, { color: colors.onBackground }]} numberOfLines={2}>
          {component.name}
        </Text>
      </View>

      {/* Center: Big Illustration Icon */}
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={component.icon as any} 
          size={56} 
          color={statusColor} 
        />
      </View>

      {/* Footer: Remaining KM & Date */}
      <View style={styles.footerInfo}>
        <Text variant="titleSmall" style={[styles.kmText, { color: colors.onBackground }]}>
          {Math.max(0, remainingKm).toLocaleString(locale)} km lagi
        </Text>
        <Text variant="bodySmall" style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
          {estimatedDateStr}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    lineHeight: 18,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  footerInfo: {
    gap: 2,
  },
  kmText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  dateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
});
