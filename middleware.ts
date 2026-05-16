import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware({
  locales: ['it', 'en'],
  defaultLocale: 'it',
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const window = rateLimitMap.get(userId)
  if (!window || now > window.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (window.count >= 6) return false
  window.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing page — skip intl redirect so app/page.tsx renders directly
  if (pathname === '/') return NextResponse.next()

  // Pass all API routes through (except rate-limited flights)
  if (pathname.startsWith('/api/') && pathname !== '/api/flights') {
    return NextResponse.next()
  }

  // Rate limit the flights API
  if (pathname === '/api/flights') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api/push|.*\\..*).*)'],
}
