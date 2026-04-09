import React, { useEffect } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { LoadingOverlay } from '@presentation/components/common/LoadingOverlay';
import { useTheme } from '@presentation/hooks/useTheme';
import { ArticleDetailScreen } from '@presentation/screens/article/ArticleDetailScreen';
import { AddVehicleScreen } from '@presentation/screens/home/AddVehicleScreen';
import { useAuthStore } from '@presentation/store/auth.store';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  const navigationTheme = isDark
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.onSurface,
          border: colors.outline,
          primary: Colors.primary ?? NavigationDarkTheme.colors.primary,
        },
      }
    : {
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.onSurface,
          border: colors.outline,
          primary: Colors.primary ?? NavigationDefaultTheme.colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: {
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 18,
          },
          headerTintColor: colors.onSurface,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="AddVehicle"
              component={AddVehicleScreen}
              options={{
                headerShown: true,
                title: t('navigation.addVehicle'),
              }}
            />
            <Stack.Screen
              name="ArticleDetail"
              component={ArticleDetailScreen}
              options={{
                headerShown: true,
                title: t('navigation.articleDetail'),
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
