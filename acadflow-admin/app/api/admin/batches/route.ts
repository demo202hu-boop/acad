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
        .select('id, name, code, year, division, batch, academic_year')
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
      .select('id, name, code, year, division, batch, academic_year')
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
