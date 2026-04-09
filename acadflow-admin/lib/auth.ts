import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'af_admin_session'
export const MAINTENANCE_COOKIE = 'acadflow_maintenance_bypass'

const getSecretKey = () => {
  const secret = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-for-acadflow-admin-change-in-prod'
  return new TextEncoder().encode(secret)
}

/**
 * Creates a signed JWT token for admin session.
 */
export async function createSessionToken(payload: any = { role: 'admin' }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey())
}

/**
 * Creates a signed JWT specifically for maintenance bypass.
 */
export async function createMaintenanceBypassToken() {
  return await new SignJWT({ maintenance_bypass: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('45s') // Short-lived bypass
    .sign(getSecretKey())
}

/**
 * Verifies a JWT token. Returns the payload if valid, null otherwise.
 */
export async function verifyToken(token: string | undefined | null) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload
  } catch (err) {
    return null
  }
}

// ============================================
// Server-side auth helpers (API routes / Server Components)
// ============================================

/**
 * Check if admin session cookie is set and valid (server-side).
 * Next.js 15: cookies() is now async.
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
    const payload = await verifyToken(sessionToken)
    return !!payload
  } catch {
    return false
  }
}

/**
 * Check if admin session is set and valid from a request (middleware).
 * Middleware still uses synchronous request.cookies.
 */
export async function isAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  const payload = await verifyToken(sessionToken)
  return !!payload
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
