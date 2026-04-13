import React, { memo } from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Surface } from 'react-native-paper';
import { Colors } from '@core/theme/colors';
import { Spacing, BorderRadius } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export const AppCard = memo<AppCardProps>(({
  children,
  onPress,
  style,
  elevation = 1,
}) => {
  const { colors, isDark } = useTheme();

  const content = (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderColor: isDark ? Colors.dark.outline : Colors.light.outline,
          shadowOpacity: isDark ? 0.3 : 0.08,
        },
        style,
      ]}
      elevation={elevation}
    >
      {children}
    </Surface>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.pressable} onPress={onPress} activeOpacity={0.86}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

AppCard.displayName = 'AppCard';

const styles = StyleSheet.create({
  pressable: {
    borderRadius: BorderRadius.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
});
