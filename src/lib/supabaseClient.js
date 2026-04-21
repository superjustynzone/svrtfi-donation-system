import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Allow import during static analysis; runtime will throw if used without proper env.
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
