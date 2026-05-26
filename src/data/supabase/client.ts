import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { ENV } from '@core/config/env';

const projectRef = (() => {
  try {
    return new URL(ENV.SUPABASE_URL).host.split('.')[0] ?? 'default';
  } catch {
    return 'default';
  }
})();

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: `sb-${projectRef}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
