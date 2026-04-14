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
  const mentorId = searchParams.get('mentor_id') || ''
  const status = searchParams.get('status') || ''
  const sortBy  = searchParams.get('sortBy')  || 'created_at'
  const sortDir = searchParams.get('sortDir') || 'desc'
  const offset = (page - 1) * limit

  try {
    // Select participation details and join student/mentor info
    let query = supabaseAdmin
      .from('participations')
      .select(`
        *,
        student:profiles!student_id(name, enrollment_number, year, division, batch),
        mentor:profiles!mentor_id(name)
      `, { count: 'exact' })

    if (mentorId) {
      query = query.eq('mentor_id', mentorId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      // Search across event details and other status text
      let searchFilter = `event_details.ilike.%${search}%,other_status_text.ilike.%${search}%`
      
      // Also search for matching students (by name or enrollment)
      const { data: matchedProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .or(`name.ilike.%${search}%,enrollment_number.ilike.%${search}%`)
      
      if (matchedProfiles && matchedProfiles.length > 0) {
        const studentIds = matchedProfiles.map(p => p.id).join(',')
        searchFilter += `,student_id.in.(${studentIds})`
      }
      
      query = query.or(searchFilter)
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error in GET /api/admin/verifications:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: { 
        page, 
        limit, 
        total: count ?? 0, 
        totalPages: Math.ceil((count ?? 0) / limit) 
      },
    })
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/admin/verifications:', error)
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
    if (!id) return NextResponse.json({ error: 'Participation ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('participations')
      .update(updates)
      .eq('id', id)
      .select('*, student:profiles!student_id(name), mentor:profiles!mentor_id(name)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
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
    const body = await request.json()
    const { 
      student_id, 
      mentor_id, 
      event_type, 
      event_details, 
      participation_status,
      status = 'pending',
      points_awarded = 0,
      event_date,
      event_end_date,
      cert_link_1,
      cert_link_2,
      description
    } = body

    if (!student_id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('participations')
      .insert([{
        student_id,
        mentor_id,
        event_type,
        event_details,
        participation_status,
        status,
        points_awarded,
        event_date,
        event_end_date,
        cert_link_1,
        cert_link_2,
        description
      }])
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

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const { error } = await supabaseAdmin
      .from('participations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
