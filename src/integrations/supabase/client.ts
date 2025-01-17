import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://trybqrktjibalolvsvej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeWJxcmt0amliYWxvbHZzdmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MjcyMzAsImV4cCI6MjAyNTQwMzIzMH0.PmGwB_-rh-bvUhBXlbqnFVYBWlGxh1Rmm03tDHXqp4c';

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