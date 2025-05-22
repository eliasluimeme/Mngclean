import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { User, LoginCredentials, Session } from './auth.types'
import { mockUsers, mockPasswords } from './mock-data'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 1 week

export async function signJWT(payload: any, expiresIn: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

export async function createTokens(user: User) {
  const accessToken = await signJWT(
    { userId: user.id, email: user.email, role: user.role },
    ACCESS_TOKEN_EXPIRY
  )
  const refreshToken = await signJWT(
    { userId: user.id, email: user.email, role: user.role },
    REFRESH_TOKEN_EXPIRY
  )
  return { accessToken, refreshToken }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 // 1 hour
  })
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
  cookieStore.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    if (new Date(session.expires) < new Date()) {
      await logout()
      return null
    }
    return session
  } catch (error) {
    console.error('Session parsing error:', error)
    await logout()
    return null
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // If no tokens, redirect to login
  if (!accessToken && !refreshToken) {
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If access token is valid, continue
  if (accessToken) {
    const payload = await verifyJWT(accessToken)
    if (payload) {
      return NextResponse.next()
    }
  }

  // If refresh token is valid, generate new tokens
  if (refreshToken) {
    const payload = await verifyJWT(refreshToken)
    if (payload) {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await createTokens({
        id: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string
      } as User)

      const response = NextResponse.next()
      response.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60
      })
      response.cookies.set('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      })
      return response
    }
  }

  // If both tokens are invalid, clear cookies and redirect to login
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  return response
}

interface LoginResult {
  success: boolean
  user?: User
  error?: string
}

// export async function login(credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> {
//   try {
//     // In a real app, you would validate credentials against your database
//     // This is just a mock implementation
//     if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
//       const user: User = {
//         id: '1',
//         email: credentials.email,
//         name: 'Admin User',
//         role: 'admin',
//         staff: true,
//         admin: true,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       }

//       await createSession(user)
//       return { success: true }
//     }

//     if (credentials.email === 'staff@example.com' && credentials.password === 'staff123') {
//       const user: User = {
//         id: '2',
//         email: credentials.email,
//         name: 'Staff User',
//         role: 'staff',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       }

//       await createSession(user)
//       return { success: true }
//     }

//     return { success: false, message: 'Invalid credentials' }
//   } catch (error) {
//     console.error('Login error:', error)
//     return { success: false, message: 'An error occurred during login' }
//   }
// }

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
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