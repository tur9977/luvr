import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // 交換 code 獲取 session
      await supabase.auth.exchangeCodeForSession(code)
      
      // 根據操作類型進行不同的重定向
      if (type === 'recovery') {
        // 密碼重設
        return NextResponse.redirect(new URL('/auth/reset-password', request.url))
      } else if (type === 'signup') {
        // 註冊確認成功，導向登入頁
        return NextResponse.redirect(new URL('/auth?tab=login&confirmed=true', request.url))
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth?error=callback_failed', request.url))
    }
  }

  // 對於其他情況，重定向到主頁或指定的頁面
  return NextResponse.redirect(new URL(next, request.url))
} 