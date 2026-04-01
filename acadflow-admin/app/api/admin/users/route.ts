import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page   = parseInt(searchParams.get('page')  || '1')
  const limit  = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const role   = searchParams.get('role')   || ''
  const sortBy  = searchParams.get('sortBy')  || 'created_at'
  const sortDir = searchParams.get('sortDir') || 'desc'
  const offset = (page - 1) * limit

  const ALLOWED_SORT = ['name','email','role','enrollment_number','year','division','copy_paste_enabled','created_at']
  const col = ALLOWED_SORT.includes(sortBy) ? sortBy : 'created_at'
  const asc = sortDir === 'asc'

  try {
    let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' })

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,enrollment_number.ilike.%${search}%`
      )
    }
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data, error, count } = await query
      .order(col, { ascending: asc, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as { id?: string }
    if (!body.id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', body.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
