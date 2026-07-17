import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type CookieSet = { name: string; value: string; options?: CookieOptions }

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && url !== 'your_supabase_url' && key !== 'your_supabase_anon_key'
}

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/success',
  '/checkout',
  '/contact',
  '/about',
  '/features',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/admin',
  '/admin/login',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping session update')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieSet[]) {
          try {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
          } catch {
          }
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getSession()

  const { pathname } = request.nextUrl
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  if (!isPublicPath) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
