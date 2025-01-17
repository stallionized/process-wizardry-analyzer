import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://trybqrktjibalolvsvej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeWJxcmt0amliYWxvbHZzdmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1ODU4ODIsImV4cCI6MjA1MTE2MTg4Mn0.69wE-pxSWLlkGsgNztaGzatByVpd62ieOAQ9qF0V_4A';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);