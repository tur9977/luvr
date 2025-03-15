import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // 如果是訪問管理員頁面
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // 如果未登入，重定向到登入頁面
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }

    // 檢查是否是管理員
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // 如果不是管理員，重定向到首頁
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 如果用戶未登入且訪問需要認證的頁面，重定向到登入頁面
  if (!session && (
    req.nextUrl.pathname.startsWith('/create') ||
    req.nextUrl.pathname.startsWith('/profile')
  )) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // 如果用戶已登入且訪問登入頁面，重定向到首頁
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// 配置需要認證的路徑
export const config = {
  matcher: [
    '/create',
    '/profile/:path*',
    '/auth',
    '/admin/:path*'
  ],
} 