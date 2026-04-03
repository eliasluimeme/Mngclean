import { NextResponse } from 'next/server'
import { serverRegister } from '@/lib/auth.server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { first_name, last_name, email, password } = await request.json()

    // Validate input
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const result = await serverRegister({
      first_name,
      last_name,
      email,
      password,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
