// Centralized environment config
export const ENV = {
  SUPABASE_URL: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim(),
  SUPABASE_ANON_KEY: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
} as const;

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file.',
  );
}
