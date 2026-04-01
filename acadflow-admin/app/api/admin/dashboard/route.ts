import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      studentsRes,
      teachersRes,
      adminsRes,
      submissionsRes,
      pendingRes,
      evaluatedRes,
      practicalsRes,
      activePracticalsRes,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'evaluated'),
      supabaseAdmin.from('batch_practicals').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('batch_practicals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    const { data: marksData } = await supabaseAdmin
      .from('submissions')
      .select('marks')
      .eq('status', 'evaluated')
      .not('marks', 'is', null)

    const marks = (marksData ?? [])
      .map((d: { marks: number | null }) => d.marks)
      .filter((m: number | null): m is number => m !== null)

    const avg = marks.length > 0
      ? marks.reduce((a: number, b: number) => a + b, 0) / marks.length
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: studentsRes.count ?? 0,
        totalTeachers: teachersRes.count ?? 0,
        totalAdmins: adminsRes.count ?? 0,
        totalSubmissions: submissionsRes.count ?? 0,
        pendingEvaluations: pendingRes.count ?? 0,
        evaluatedSubmissions: evaluatedRes.count ?? 0,
        averageGrade: Math.round(avg * 10) / 10,
        activePracticals: activePracticalsRes.count ?? 0,
        closedPracticals: (practicalsRes.count ?? 0) - (activePracticalsRes.count ?? 0),
        totalPracticals: practicalsRes.count ?? 0,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
