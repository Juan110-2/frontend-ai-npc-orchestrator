import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/auth/login', '/auth/recuperar']

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const hasAuth = request.cookies.get(AUTH_COOKIE_NAME)?.value === '1'

  if (!hasAuth && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (hasAuth && isPublic) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
