import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as { practicalId?: string; marks?: number; status?: string }
    const { practicalId, marks, status } = body

    if (!practicalId) {
      return NextResponse.json({ error: 'Practical ID is required' }, { status: 400 })
    }
    if (marks == null && !status) {
      return NextResponse.json({ error: 'marks or status required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { evaluated_at: new Date().toISOString() }
    if (marks != null) { updates.marks = marks; updates.status = 'evaluated' }
    if (status) updates.status = status

    const { error, count } = await supabaseAdmin
      .from('submissions')
      .update(updates)
      .eq('practical_id', practicalId)
      .eq('status', 'submitted')

    if (error) throw error
    return NextResponse.json({ success: true, updated: count })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
