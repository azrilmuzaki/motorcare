import { useEffect, useCallback, useMemo, useState } from 'react';
import { enrichVehicle } from '@domain/logic/vehicle.logic';
import { useVehicleStore } from '@presentation/store/vehicle.store';
import { useAuthStore } from '@presentation/store/auth.store';

/**
 * Hook untuk manajemen kendaraan
 */
export function useVehicles() {
  const store = useVehicleStore();
  const { user } = useAuthStore();
  const [projectionNow, setProjectionNow] = useState(() => Date.now());
  const fetchVehicles = store.fetchVehicles;

  const refresh = useCallback(() => {
    if (user?.id) {
      void fetchVehicles(user.id);
    }
  }, [fetchVehicles, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProjectionNow(Date.now());
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const projectedVehicles = useMemo(() => {
    const now = new Date(projectionNow);
    return store.vehicles.map(vehicle => enrichVehicle(vehicle, now));
  }, [projectionNow, store.vehicles]);

  const projectedSelectedVehicle = useMemo(() => {
    if (!store.selectedVehicle) {
      return null;
    }

    return enrichVehicle(store.selectedVehicle, new Date(projectionNow));
  }, [projectionNow, store.selectedVehicle]);

  return {
    ...store,
    vehicles: projectedVehicles,
    selectedVehicle: projectedSelectedVehicle,
    refresh,
  };
}
