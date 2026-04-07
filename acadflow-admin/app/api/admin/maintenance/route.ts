import { NextResponse } from 'next/server'
import { isAuthenticatedServer } from '@/lib/auth'
import { maintenanceDb } from '@/lib/supabase-maintenance'

// ── GET — read current maintenance status ────────────────────────────────────
export async function GET() {
  try {
    const { data, error } = await maintenanceDb
      .from('site_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, active: data.value === 'true' })
  } catch (err: any) {
    console.error('[Maintenance GET]', err)
    // Fail open — don't block the site if the DB is unreachable
    return NextResponse.json({ success: false, active: false, error: err.message })
  }
}

// ── POST — set maintenance status (admin only) ───────────────────────────────
export async function POST(req: Request) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { active } = await req.json()
    if (typeof active !== 'boolean') {
      return NextResponse.json({ success: false, error: '`active` must be a boolean' }, { status: 400 })
    }

    const { error } = await maintenanceDb
      .from('site_config')
      .upsert({ key: 'maintenance_mode', value: String(active) }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ success: true, active })
  } catch (err: any) {
    console.error('[Maintenance POST]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
