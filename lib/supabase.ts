import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Browser client for client-side operations with optimized configuration
export const createBrowserSupabaseClient = () => 
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        fetch: fetch
      }
    }
  );

// Export createClient function for components that need it
export const createClient = () => {
  return createBrowserSupabaseClient();
};

// Export pre-created browser client for use in client components
export const supabase = createBrowserSupabaseClient();

// Admin client for server-side operations that need service role permissions
export const getAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used on the client side');
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
  });
};
