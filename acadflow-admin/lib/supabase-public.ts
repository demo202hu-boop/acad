import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Public Supabase client — uses anon key.
 * Safe to use in browser components.
 * Limited by RLS policies.
 */
export const supabasePublic = createClient(supabaseUrl, anonKey)
