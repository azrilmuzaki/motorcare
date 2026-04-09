import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@presentation/navigation/AppNavigator';
import { ErrorBoundary } from '@presentation/components/common/ErrorBoundary';
import { LoadingOverlay } from '@presentation/components/common/LoadingOverlay';
import { useTheme } from '@presentation/hooks/useTheme';
import { useSettingsStore } from '@presentation/store/settings.store';

import './i18n';

function AppContent() {
  const { theme, isDark } = useTheme();
  const { loadLanguage, loadSettings } = useSettingsStore();
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([loadSettings(), loadLanguage()]).finally(() => {
      if (active) {
        setSettingsReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [loadLanguage, loadSettings]);

  if (!settingsReady) {
    return <LoadingOverlay />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator />
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return <LoadingOverlay />;

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
