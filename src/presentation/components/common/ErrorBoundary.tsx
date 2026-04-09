import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { Spacing } from '@core/theme/typography';
import i18n from '../../../../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.emoji}>
            :(
          </Text>
          <Text variant="titleMedium" style={styles.title}>
            {i18n.t('errorBoundary.title')}
          </Text>
          <Text variant="bodySmall" style={styles.message}>
            {this.state.error?.message ?? i18n.t('errorBoundary.unknown')}
          </Text>
          <Button mode="contained" onPress={this.handleRetry} style={styles.button}>
            {i18n.t('errorBoundary.retry')}
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: Spacing.xl,
  },
  button: {
    borderRadius: 12,
  },
});
