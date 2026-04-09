import { NextResponse } from 'next/server'
import { maintenanceDb } from '@/lib/supabase-maintenance'
import { createMaintenanceBypassToken, MAINTENANCE_COOKIE } from '@/lib/auth'

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
    
    const token = await createMaintenanceBypassToken()
    const res = NextResponse.json({ success: true })
    res.cookies.set(MAINTENANCE_COOKIE, token, { maxAge: 45, path: '/' })
    return res
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
