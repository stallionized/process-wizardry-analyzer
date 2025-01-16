import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trybqrktjibalolvsvej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeWJxcmt0amliYWxvbHZzdmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MzI0NzAsImV4cCI6MjAyNTQwODQ3MH0.qDlZHnZeqLXw5FfQB9Yvq5Qw_NapMXqZvh8m9L_Qr1Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  }
});