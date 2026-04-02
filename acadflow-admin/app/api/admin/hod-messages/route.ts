import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthenticatedServer } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch hod messages
    const { data: messages, error } = await supabaseAdmin
      .from('hod_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch teachers (profiles) to map names manually just in case the direct join fails
    const { data: profiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')

    if (profError) throw profError

    const profileMap = new Map()
    profiles?.forEach(p => profileMap.set(p.id, p))

    const enrichedData = messages?.map(msg => ({
      ...msg,
      teacher: profileMap.get(msg.teacher_id) || { name: 'Unknown Teacher', email: 'N/A' }
    })) || []

    return NextResponse.json({ success: true, data: enrichedData })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, is_read } = await req.json()
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('hod_messages')
      .update({ is_read })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!await isAuthenticatedServer()) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 })

    const { error } = await supabaseAdmin.from('hod_messages').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
