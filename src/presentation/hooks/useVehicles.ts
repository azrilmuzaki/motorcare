import { useEffect, useCallback } from 'react';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useAuthStore } from '@presentation/store/auth.store';

/**
 * Hook untuk manajemen kendaraan
 */
export function useVehicles() {
  const store = useVehicleStore();
  const { user } = useAuthStore();

  const refresh = useCallback(() => {
    if (user?.id) {
      store.fetchVehicles(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...store,
    refresh,
  };
}