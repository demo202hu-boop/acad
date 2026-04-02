import { NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase-public'

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 })
    }

    const { data, error } = await supabasePublic
      .from('support_tickets')
      .insert([{ name, email, subject, message, status: 'open' }])
      .select()

    if (error) {
      console.error('Error raising ticket:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
