import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected paths
  const protectedPaths = ['/dashboard', '/admin-settings', '/manage-users']
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if trying to access protected path without session
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect away from auth pages if already logged in
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/admin-settings', '/manage-users', '/login'],
}
