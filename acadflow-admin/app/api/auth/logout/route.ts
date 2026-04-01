import { NextResponse } from 'next/server'
import { getClearSessionCookieOptions } from '@/lib/auth'

export async function POST() {
  const cookieOptions = getClearSessionCookieOptions()
  const response = NextResponse.json({ success: true })
  response.cookies.set(cookieOptions)
  return response
}
