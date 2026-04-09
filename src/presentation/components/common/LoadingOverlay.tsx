import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@core/theme/colors';
import { useTheme } from '@presentation/hooks/useTheme';

export const LoadingOverlay = memo(() => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
