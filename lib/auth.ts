import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  name: string
}

/**
 * Authenticate a player with name and passphrase
 * @param name Player name
 * @param passphrase Player passphrase
 * @returns Player object if successful, null otherwise
 */
export async function authenticatePlayer(
  name: string,
  passphrase: string
): Promise<AuthUser | null> {
  const supabase = await createClient()

  // Query the players table for matching credentials
  const { data, error } = await supabase
    .from('players')
    .select('id, name, passphrase')
    .eq('name', name)
    .single()

  if (error || !data) {
    return null
  }

  // In production, you should use proper password hashing (bcrypt, argon2, etc.)
  // For now, we're doing simple string comparison
  if (data.passphrase !== passphrase) {
    return null
  }

  return {
    id: data.id,
    name: data.name,
  }
}

/**
 * Set authentication cookie
 * @param userId Player ID
 */
export async function setAuthCookie(userId: string, userName: string) {
  const cookieStore = await cookies()

  // Store user session as a Base64 encoded JSON string
  const sessionData = JSON.stringify({ userId, userName })
  const encodedSession = Buffer.from(sessionData).toString('base64')

  const oneMonth = 60 * 60 * 24 * 30 * 1000 // 30 days in milliseconds

  cookieStore.set('motogp_session', encodedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: oneMonth / 1000, // seconds
    expires: new Date(Date.now() + oneMonth),
  })
}

/**
 * Get current authenticated user from cookie
 * @returns AuthUser or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('motogp_session')

  if (!sessionCookie) {
    return null
  }

  try {
    // Try to parse as direct JSON first (backward compatibility for dev), then fallback to base64
    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch {
      // If JSON parse fails, try base64 decode
      const decodedString = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      sessionData = JSON.parse(decodedString)
    }

    return {
      id: sessionData.userId,
      name: sessionData.userName,
    }
  } catch {
    return null
  }
}

/**
 * Clear authentication cookie (logout)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('motogp_session')
}

/**
 * Check if user is admin
 * @param name Player name
 * @returns true if admin
 */
export function isAdmin(name: string): boolean {
  // In production, you might want to store admin status in the database
  return name.toLowerCase() === 'admin'
}

/**
 * Get current user and verify admin status
 * Combines getCurrentUser() and isAdmin() check for admin route protection
 * @returns Admin user object or null if not authenticated or not admin
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser()

  if (!user || !isAdmin(user.name)) {
    return null
  }

  return user
}
