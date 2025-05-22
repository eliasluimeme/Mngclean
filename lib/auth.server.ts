import { cookies } from 'next/headers'
import { LoginCredentials, Session, User } from './auth.types'
import { supabase } from './supabase'
import bcrypt from 'bcryptjs'
import { clearAuthCookies } from './auth'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 1 week

export async function serverLogin(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Fetch user from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, password, role, staff, admin, created_at, updated_at')
      .eq('email', email)
      .limit(1)
      if (error || !users || users.length === 0) {
      return { success: false, error: 'Invalid credentials' }
    }
    const user = users[0]
    // Check password (assume plaintext for demo; use hash in production)
    // if (!user.password || user.password !== password) {
    //   console.log(user.password, password)
    //   return { success: false, error: 'Invalid credentials' }
    // }
    console.log(password, user.password)
    const passwordMatch = user.password && (await bcrypt.compare(password, user.password));
    if (!passwordMatch) {
      return { success: false, error: 'Incorrect password'};
    }

    // Only allow staff or admin
    if (!user.staff && !user.admin) {
      return { success: false, error: 'Access denied: not staff or admin' }
    }
    // Compose user object for session
    const sessionUser: User = {
      id: user.id,
      email: user.email,
      name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      role: user.admin ? 'admin' : 'staff',
      staff: user.staff,
      admin: user.admin,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
    await createSession(sessionUser)
    return { success: true, user: sessionUser }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

export async function serverLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  await clearAuthCookies()
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    if (new Date(session.expires) < new Date()) {
      await serverLogout()
      return null
    }
    return session
  } catch (error) {
    console.error('Session parsing error:', error)
    await serverLogout()
    return null
  }
}

async function createSession(user: User): Promise<void> {
  const session: Session = {
    user,
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
} 