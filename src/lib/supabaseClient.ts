import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isOffline = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';

const dummyQueryBuilder = {
  select: () => Promise.resolve({ data: [], error: null }),
  insert: () => Promise.resolve({ data: null, error: null }),
  update: () => Promise.resolve({ data: null, error: null }),
  upsert: () => Promise.resolve({ data: null, error: null }),
  delete: () => ({
    in: () => Promise.resolve({ data: null, error: null })
  })
};

export const supabase = isOffline
  ? ({
      from: () => dummyQueryBuilder
    } as any)
  : createClient(supabaseUrl, supabaseAnonKey);
