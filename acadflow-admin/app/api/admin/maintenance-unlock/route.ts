import { NextResponse } from 'next/server'
import { maintenanceDb } from '@/lib/supabase-maintenance'

/**
 * Called by the maintenance HTML page's hidden "mkc" double-tap unlock.
 * Verifies the secret code and disables maintenance mode if correct.
 * No session required — code acts as the auth.
 */
export async function POST(req: Request) {
  try {
    const { code } = await req.json()
    const secret = process.env.NEXT_PUBLIC_MAINTENANCE_CODE || ''

    if (!code || code.trim() !== secret) {
      return NextResponse.json({ success: false, error: 'Wrong code' }, { status: 401 })
    }

    const { error } = await maintenanceDb
      .from('site_config')
      .upsert({ key: 'maintenance_mode', value: 'false' }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
