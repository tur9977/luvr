import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    // 獲取並立即解構 session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Middleware session error:', sessionError)
      return res
    }

    // 為靜態資源添加緩存控制
    if (req.nextUrl.pathname.match(/\.(jpg|jpeg|png|webp|avif|gif|ico)$/)) {
      res.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return res
    }

    // 為 API 響應添加緩存控制
    if (req.nextUrl.pathname.startsWith('/api/')) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      return res
    }

    // 檢查當前路徑是否需要認證
    const isProtectedRoute = 
      req.nextUrl.pathname.startsWith('/create') ||
      req.nextUrl.pathname.startsWith('/profile') ||
      req.nextUrl.pathname.startsWith('/admin')

    // 檢查是否是認證相關頁面
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')

    // 如果是受保護的路由且用戶未登入
    if (isProtectedRoute && !session?.user) {
      console.log('No session found for protected route:', {
        path: req.nextUrl.pathname,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        cookies: req.cookies.getAll()
      })
      
      // 檢查是否有 Supabase 認證 cookie
      const hasAuthCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb-refresh-token')
      
      if (!hasAuthCookie) {
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // 如果有認證 cookie，給予短暫的寬限期
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 重新檢查 session
      const { data: { session: refreshedSession } } = await supabase.auth.getSession()
      
      if (!refreshedSession?.user) {
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // 如果是管理員頁面，需要額外的權限檢查
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session!.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // 如果用戶已登入但訪問認證頁面
    if (session?.user && isAuthRoute) {
      console.log('Redirecting authenticated user from auth page:', {
        userId: session.user.id,
        currentPath: req.nextUrl.pathname
      })
      
      const returnTo = req.nextUrl.searchParams.get('returnTo')
      const redirectUrl = returnTo ? new URL(returnTo, req.url) : new URL('/', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // 添加用戶信息到響應頭（用於調試）
    if (session?.user) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-auth-state', 'authenticated')
    }

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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 