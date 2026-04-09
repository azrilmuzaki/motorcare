import { useEffect } from 'react';
import { useAuthStore } from '@presentation/store/auth.store';
import { AuthService } from '@data/services/auth.service';

/**
 * Hook untuk auth dengan auto-initialize
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();

    // Subscribe auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          store.setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return store;
}