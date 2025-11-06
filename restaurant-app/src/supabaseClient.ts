import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;
let hasWarnedMissingEnv = false;

export const maybeSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!hasWarnedMissingEnv) {
      console.warn(
        'Supabase environment variables are not set. Checkout features will be disabled.'
      );
      hasWarnedMissingEnv = true;
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
};
