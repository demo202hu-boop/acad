import { createClient } from '@supabase/supabase-js'

const url            = process.env.MAINTENANCE_SUPABASE_URL!
const serviceRoleKey = process.env.MAINTENANCE_SUPABASE_SERVICE_ROLE_KEY!

if (!url)            throw new Error('Missing MAINTENANCE_SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing MAINTENANCE_SUPABASE_SERVICE_ROLE_KEY')

/**
 * Admin client for the MAINTENANCE Supabase project.
 * Only used in server-side API routes — never in the browser.
 */
export const maintenanceDb = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
