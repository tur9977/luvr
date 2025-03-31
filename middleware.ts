import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Middleware - Current path:', req.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)

    // 檢查當前路徑是否需要認證
    const isProtectedRoute = 
      req.nextUrl.pathname.startsWith('/create') ||
      req.nextUrl.pathname.startsWith('/profile') ||
      req.nextUrl.pathname.startsWith('/admin') ||
      req.nextUrl.pathname.match(/^\/events\/[^/]+\/edit/)

    console.log('Middleware - Is protected route:', isProtectedRoute)

    // 如果是受保護的路由且用戶未登入，重定向到登入頁面
    if (isProtectedRoute && !session?.user) {
      console.log('Middleware - Access denied, redirecting to login')
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // 如果用戶已登入，在響應頭中添加用戶信息
    if (session?.user) {
      res.headers.set('x-user-id', session.user.id)
    }

    console.log('Middleware - Access granted')
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

// 配置需要認證的路徑
export const config = {
  matcher: [
    '/create',
    '/profile/:path*',
    '/auth/:path*',
    '/admin/:path*',
    '/events/:path*/edit',
  ],
} 