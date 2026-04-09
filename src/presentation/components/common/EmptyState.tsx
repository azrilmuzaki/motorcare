import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AppButton } from './AppButton';
import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import { useTheme } from '@presentation/hooks/useTheme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo<EmptyStateProps>(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={42}
          color={Colors.primary}
          style={styles.icon}
        />
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.description, { color: colors.onSurfaceVariant }]}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          style={styles.button}
          fullWidth={false}
        />
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    opacity: 0.9,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
    maxWidth: 320,
  },
  button: {
    minWidth: 180,
  },
});
