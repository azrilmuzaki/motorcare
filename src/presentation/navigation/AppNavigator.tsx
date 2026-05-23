import React, { useEffect } from 'react';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { LoadingOverlay } from '@presentation/components/common/LoadingOverlay';
import { useTheme } from '@presentation/hooks/useTheme';
import { AddVehicleScreen } from '@presentation/screens/home/AddVehicleScreen';
import { AddComponentScreen } from '@presentation/screens/home/AddComponentScreen';
import { AddReminderScreen } from '@presentation/screens/home/AddReminderScreen';
import { AddServiceScreen } from '@presentation/screens/home/AddServiceScreen';
import { UpdateOdometerScreen } from '@presentation/screens/home/UpdateOdometerScreen';
import { VehicleDetailScreen } from '@presentation/screens/home/VehicleDetailScreen';
import { VehiclesListScreen } from '@presentation/screens/vehicles/VehiclesListScreen';
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
              name="AddComponent"
              component={AddComponentScreen}
              options={{
                headerShown: true,
                title: 'Tambah Komponen',
              }}
            />
            <Stack.Screen
              name="AddReminder"
              component={AddReminderScreen}
              options={{
                headerShown: true,
                title: 'Tambah Pengingat',
              }}
            />
            <Stack.Screen
              name="AddService"
              component={AddServiceScreen}
              options={{
                headerShown: true,
                title: 'Tambah Servis',
              }}
            />
            <Stack.Screen
              name="UpdateOdometer"
              component={UpdateOdometerScreen}
              options={{
                headerShown: true,
                title: 'Perbarui Odometer',
              }}
            />
            <Stack.Screen
              name="VehicleDetail"
              component={VehicleDetailScreen}
              options={{
                headerShown: true,
                title: 'Detail Kendaraan',
              }}
            />
            <Stack.Screen
              name="VehiclesList"
              component={VehiclesListScreen}
              options={{
                headerShown: true,
                title: 'Semua Kendaraan',
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
