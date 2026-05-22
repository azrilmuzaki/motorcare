import React, { useCallback } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import type { Vehicle } from '@domain/types/vehicle.types';
import { VEHICLE_TYPE_ICONS } from '@core/constants/app.constants';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import { useVehicles } from '@presentation/hooks/useVehicles';
import type { RootStackParamList } from '@presentation/navigation/types';
import { useVehicleStore } from '@presentation/store/vehicle.store';

export function VehiclesListScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { vehicles } = useVehicles();

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      useVehicleStore.getState().selectVehicle(vehicle);
      navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
    },
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<Vehicle>>(
    ({ item }) => (
      <Pressable
        style={[styles.vehicleRow, { backgroundColor: isDark ? colors.surfaceElevated : colors.surface }]}
        onPress={() => handleVehiclePress(item)}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.08)' }}
      >
        <View style={[styles.vehicleIconBox, { backgroundColor: isDark ? Colors.dark.hero : Colors.primaryLight }]}>
          <MaterialCommunityIcons
            name={VEHICLE_TYPE_ICONS[item.type] ?? 'car'}
            size={22}
            color={Colors.primary}
          />
        </View>
        <View style={styles.vehicleTextContent}>
          <Text variant="titleMedium" style={[styles.vehicleName, { color: colors.onBackground }]}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={[styles.vehicleKm, { color: colors.onSurfaceVariant }]}>
            {(item.projectedCurrentKm ?? item.currentKm ?? 0).toLocaleString('id-ID')} km
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.onSurfaceVariant}
        />
      </Pressable>
    ),
    [colors, isDark, handleVehiclePress],
  );

  const keyExtractor = useCallback((item: Vehicle) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={vehicles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xl }]}
        ListEmptyComponent={
          <EmptyState
            icon="car-off"
            title={t('vehicles.empty.title')}
            description={t('vehicles.empty.subtitle')}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleTextContent: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleKm: {
    fontFamily: 'Poppins_400Regular',
  },
});
