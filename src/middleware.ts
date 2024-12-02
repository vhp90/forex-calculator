import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add the current pathname as a header
  response.headers.set('x-pathname', request.nextUrl.pathname)

  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page and auth endpoints
    if (
      request.nextUrl.pathname === '/admin/login' ||
      request.nextUrl.pathname === '/api/admin/auth' ||
      request.nextUrl.pathname === '/api/admin/check-auth'
    ) {
      // Set secure cookie attributes when setting admin_session
      if (request.nextUrl.pathname === '/api/admin/auth') {
        response.cookies.set('admin_session', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        })
      }
      return response
    }

    // Check for admin session
    const session = request.cookies.get('admin_session')
    if (!session || session.value !== 'authenticated') {
      // Redirect to login if no valid session
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
