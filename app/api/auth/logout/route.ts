import { NextResponse } from 'next/server'
import { serverLogout } from '@/lib/auth.server'

export async function POST() {
  try {
    await serverLogout()
    const response = NextResponse.json({ success: true })
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
    // response.cookies.set('accessToken', '', { path: '/', maxAge: 0 })
    // response.cookies.set('refreshToken', '', { path: '/', maxAge: 0 })
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 