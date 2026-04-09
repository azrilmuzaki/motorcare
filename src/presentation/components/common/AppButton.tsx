import React, { memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  style?: StyleProp<ViewStyle>;
  icon?: string;
  fullWidth?: boolean;
}

export const AppButton = memo<AppButtonProps>(({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'contained',
  style,
  icon,
  fullWidth = true,
}) => {
  return (
    <Button
      mode={variant}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      contentStyle={[styles.content, fullWidth && styles.fullWidth]}
      labelStyle={styles.label}
      style={[styles.button, style]}
    >
      {label}
    </Button>
  );
});

AppButton.displayName = 'AppButton';

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
  },
  content: {
    height: 52,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
