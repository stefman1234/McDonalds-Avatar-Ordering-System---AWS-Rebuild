import { createClient } from '@supabase/supabase-js';

// Supabase client for client-side operations (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Supabase admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper function to test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1);

    // If table doesn't exist, that's actually a GOOD sign - connection works!
    if (error && (error.code === '42P01' || error.message.includes('table') || error.message.includes('schema cache'))) {
      return {
        success: true,
        message: 'Connection successful! Database is empty (no tables yet).',
        connected: true
      };
    }

    if (error) {
      return { success: false, message: error.message, connected: false };
    }

    return { success: true, message: 'Connection successful!', data, connected: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      connected: false
    };
  }
}
