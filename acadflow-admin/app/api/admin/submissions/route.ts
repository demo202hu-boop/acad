import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const studentId = searchParams.get('student_id') || ''
  const batchId = searchParams.get('batch_id') || ''   // Named batch ID from batches table
  const offset = (page - 1) * limit

  try {
    let query = supabaseAdmin
      .from('submissions')
      .select(
        `*,
        student:profiles!submissions_student_id_fkey(id, name, email, enrollment_number, department, year, division, batch),
        assignment:assignments(id, title, total_points),
        practical:batch_practicals(id, title, experiment_number, total_points)`,
        { count: 'exact' }
      )

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by specific student
    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Filter by named batch (via practical's batch_id)
    if (batchId) {
      // Get practical IDs that belong to this batch
      const { data: practicals } = await supabaseAdmin
        .from('batch_practicals')
        .select('id')
        .eq('batch_id', batchId)
      const practicalIds = (practicals ?? []).map((p: { id: string }) => p.id)
      if (practicalIds.length > 0) {
        query = query.in('practical_id', practicalIds)
      } else {
        // No practicals in this batch → no submissions
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    const { data, error, count } = await query
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Client-side filtering on joined student fields
    interface SubRow {
      student?: { name?: string; enrollment_number?: string; division?: string; batch?: string } | null
      practical?: { title?: string } | null
      assignment?: { title?: string } | null
    }
    let filtered = (data ?? []) as SubRow[]

    if (search) {
      const term = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.student?.name?.toLowerCase().includes(term) ||
        s.student?.enrollment_number?.toLowerCase().includes(term) ||
        s.practical?.title?.toLowerCase().includes(term) ||
        s.assignment?.title?.toLowerCase().includes(term)
      )
    }

    return NextResponse.json({
      success: true,
      data: filtered,
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
    if (!id) return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({
        ...updates,
        evaluated_at: new Date().toISOString(),
        status: updates.marks != null ? 'evaluated' : updates.status,
      })
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
    if (!body.id) return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('submissions').delete().eq('id', body.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
