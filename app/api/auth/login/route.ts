import { NextResponse } from 'next/server'
import { serverLogin } from '@/lib/auth.server'
import bcrypt from 'bcryptjs';


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const result = await serverLogin(email, password)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 