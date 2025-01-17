import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://trybqrktjibalolvsvej.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeWJxcmt0amliYWxvbHZzdmVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU4NTg4MiwiZXhwIjoyMDUxMTYxODgyfQ.5-AjA82X90VpCl_en4iYXbuXQ1pOd6TL9ziWfoIimpI';

export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);