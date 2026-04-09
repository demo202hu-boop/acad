import { NextResponse } from 'next/server'
import { validateAdminPassword, getSessionCookieOptions, createSessionToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { password?: string }

    if (!body.password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const isValid = validateAdminPassword(body.password)

    if (!isValid) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    const cookieOptions = getSessionCookieOptions()
    const token = await createSessionToken()
    const response = NextResponse.json({ success: true })
    response.cookies.set({ ...cookieOptions, value: token })
    return response
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
