import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth.server'

// Define role-based route access
const roleBasedRoutes = {
  admin: ['/dashboard', '/users', '/staff', '/reports', '/settings', '/api/services', '/api/teams', '/api/users', '/api/invoices', '/api/orders',],
  staff: ['/bookings', '/orders', '/invoices', '/users', '/settings', '/api/users', '/api/invoices', '/api/orders',],
} as const

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/me', ]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Skip image files
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/')
  // Get session
  const session = await getSession()

  // If API route and no session, return 401 JSON
  if (isApiRoute && !session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // If page route and no session, redirect to login
  if (!isApiRoute && !session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Role-based access for API and page routes
  if (session) {
    const userRole = session.user.role
    const allowedRoutes = roleBasedRoutes[userRole as keyof typeof roleBasedRoutes] || []
    // For API: allow if the route matches allowed routes
    if (isApiRoute && !allowedRoutes.some(route => pathname.startsWith(route))) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log("request.url", request.url, pathname)

    // For pages: redirect if not allowed
    if (!isApiRoute && !allowedRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 