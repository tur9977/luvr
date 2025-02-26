import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 刷新 session 如果存在的話
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 如果用戶未登入且訪問受保護的路徑，重定向到登入頁面
  if (!session && req.nextUrl.pathname.match(/^\/(?:profile|create|settings)/)) {
    const redirectUrl = new URL('/auth', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// 配置需要認證的路徑
export const config = {
  matcher: [
    /*
     * 匹配所有需要認證的路徑:
     * - /profile
     * - /create
     * - /settings
     */
    '/profile/:path*',
    '/create/:path*',
    '/settings/:path*',
  ],
} 