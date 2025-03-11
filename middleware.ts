import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // 如果是訪問管理員登入頁面
  if (request.nextUrl.pathname === '/admin/login') {
    // 如果已經登入，檢查是否是管理員
    if (session) {
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      // 如果是管理員，重定向到管理員儀表板
      if (adminRole) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    // 如果未登入或不是管理員，允許訪問登入頁面
    return response
  }

  // 如果是訪問其他管理員頁面
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 如果未登入，重定向到登入頁面
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // 檢查是否是管理員
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    // 如果不是管理員，重定向到首頁
    if (!adminRole) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 如果用戶未登入且訪問需要認證的頁面，重定向到登入頁面
  if (!session && (
    request.nextUrl.pathname.startsWith('/create') ||
    request.nextUrl.pathname.startsWith('/profile')
  )) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // 如果用戶已登入且訪問登入頁面，重定向到首頁
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

// 配置需要認證的路徑
export const config = {
  matcher: [
    '/create',
    '/profile/:path*',
    '/auth',
    '/auth/callback',
  ],
} 