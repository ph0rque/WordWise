import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Admin-only routes that need basic protection
  const adminRoutes = ['/admin']
  
  // For admin routes, let the client-side handle authentication
  // Since Supabase uses localStorage by default, not cookies,
  // we'll disable server-side auth checking and rely on client-side protection
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // Skip cookie-based auth check since Supabase uses localStorage
    // The actual authentication and role verification will happen on the client side
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 