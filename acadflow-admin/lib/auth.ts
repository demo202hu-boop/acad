import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'af_admin_session'
const SESSION_VALUE = 'authenticated'

// ============================================
// Server-side auth helpers (API routes / Server Components)
// ============================================

/**
 * Check if admin session cookie is set (server-side).
 * Next.js 15: cookies() is now async.
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    return session?.value === SESSION_VALUE
  } catch {
    return false
  }
}

/**
 * Check if admin session cookie is set from a request (middleware).
 * Middleware still uses synchronous request.cookies.
 */
export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  const session = request.cookies.get(SESSION_COOKIE)
  return session?.value === SESSION_VALUE
}

/**
 * Validate the admin password against env variable.
 */
export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set in environment variables')
    return false
  }
  // Trim both to guard against whitespace/newline in env files
  return password.trim() === adminPassword.trim()
}

/**
 * Get session cookie config for login response.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: SESSION_VALUE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  }
}

/**
 * Get clear session cookie options for logout.
 */
export function getClearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}
