import { useEffect, useCallback } from 'react';
import { useServiceLogStore } from '@presentation/store/serviceLog.store';
import { useAuthStore } from '@presentation/store/auth.store';

export function useServiceLogs() {
  const store = useServiceLogStore();
  const { user } = useAuthStore();

  const refresh = useCallback(() => {
    if (user?.id) {
      store.fetchLogs(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...store, refresh };
}