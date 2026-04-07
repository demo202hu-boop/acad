import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

// Returns named batches from the batches table
// Optionally filters to only batches a specific student has submissions in
export async function GET(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id') || ''

  try {
    if (studentId) {
      // Get only the batches this student has submissions for
      // submissions → batch_practicals (practical_id) → batches (batch_id)
      const { data: subs, error: subErr } = await supabaseAdmin
        .from('submissions')
        .select(`
          practical:batch_practicals!submissions_practical_id_fkey(
            batch_id
          )
        `)
        .eq('student_id', studentId)
        .not('practical_id', 'is', null)

      if (subErr) throw subErr

      // Collect unique batch_ids from practicals
      const batchIds = [...new Set(
        (subs ?? [])
          .flatMap((s: Record<string, unknown>) => {
            const p = s.practical
            if (!p) return []
            // Supabase returns either object or array depending on cardinality
            if (Array.isArray(p)) return (p as { batch_id?: string }[]).map(x => x.batch_id)
            return [(p as { batch_id?: string }).batch_id]
          })
          .filter((id): id is string => !!id)
      )]

      if (batchIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      // Fetch those specific batches
      const { data: batches, error: batchErr } = await supabaseAdmin
        .from('batches')
        .select('id, name, code, year, division, batch, academic_year, created_by')
        .in('id', batchIds)
        .order('year',     { ascending: true })
        .order('division', { ascending: true })
        .order('batch',    { ascending: true })

      if (batchErr) throw batchErr

      return NextResponse.json({ success: true, data: batches ?? [] })
    }

    // No student_id — return all batches
    const { data, error } = await supabaseAdmin
      .from('batches')
      .select('id, name, code, year, division, batch, academic_year, created_by')
      .order('year',     { ascending: true })
      .order('division', { ascending: true })
      .order('batch',    { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as Record<string, unknown>

    // Validate required fields
    if (!body.name || !body.division || !body.batch) {
      return NextResponse.json(
        { error: 'name, division, and batch are required' },
        { status: 400 }
      )
    }

    // Auto-generate a code if not provided
    if (!body.code) {
      body.code = `${String(body.division).toUpperCase()}${String(body.batch).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    }

    const { data, error } = await supabaseAdmin
      .from('batches')
      .insert(body)
      .select('id, name, code, year, division, batch, academic_year, created_by')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
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

    if (!id) return NextResponse.json({ error: 'Batch ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select('id, name, code, year, division, batch, academic_year, created_by')
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
    if (!body.id) return NextResponse.json({ error: 'Batch ID required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('batches')
      .delete()
      .eq('id', body.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

