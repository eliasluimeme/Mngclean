import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth.server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    console.log("req", request.url, request.nextUrl.pathname)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow staff or admin
    if (!session.user.staff && !session.user.admin) {
      return NextResponse.json(
        { error: 'Access denied: not staff or admin' },
        { status: 403 }
      )
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 