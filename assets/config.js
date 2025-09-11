import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('✅ Supabase client initialized (config.js)');

export const SUPABASE_URL = 'https://wezfdjtopfgqdcjfmdtj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlemZkanRvcGZncWRjamZtZHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjkxNTMsImV4cCI6MjA2Mjk0NTE1M30.H7wt4H5fLnIJdNDcJjV8pgm-2GkXqol8DpdgGIP9Pqs';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);