import { createClient } from '@supabase/supabase-js';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      _supabase = createClient(url, key);
    }
  }
  return _supabase;
}

// Proxy so existing `supabase.from(...)` calls work without changes
export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

