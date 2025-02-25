"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="container max-w-lg mx-auto p-4">
      <Card className="border-none shadow-none">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">登入 / 註冊</h1>
          <p className="text-sm text-muted-foreground">
            請輸入您的電子郵件以登入或註冊
          </p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'black',
                    brandAccent: '#333',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#EEE',
                    defaultButtonBackgroundHover: '#DDD',
                    inputBackground: 'white',
                    inputBorder: '#DDD',
                    inputBorderFocus: 'black',
                    inputText: 'black',
                  },
                },
              },
              style: {
                container: {
                  maxWidth: '100%',
                },
                button: {
                  border: '1px solid black',
                  borderRadius: '0.5rem',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  height: '40px',
                  backgroundColor: 'black',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#333',
                  },
                },
                input: {
                  borderRadius: '0.5rem',
                  padding: '8px 12px',
                  fontSize: '14px',
                  height: '40px',
                  backgroundColor: 'white',
                  borderColor: '#DDD',
                  '&:focus': {
                    borderColor: 'black',
                  },
                },
                label: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'black',
                  marginBottom: '8px',
                },
                anchor: {
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'black',
                  '&:hover': {
                    color: '#333',
                  },
                },
                message: {
                  fontSize: '14px',
                  padding: '8px',
                  marginBottom: '16px',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F5F5F5',
                  color: 'black',
                },
                divider: {
                  backgroundColor: '#DDD',
                  margin: '24px 0',
                },
              },
            }}
            providers={['google', 'github']}
            localization={{
              variables: {
                sign_in: {
                  email_label: '電子郵件',
                  password_label: '密碼',
                  button_label: '登入',
                  loading_button_label: '登入中...',
                  social_provider_text: '使用 {{provider}} 登入',
                  link_text: '已經有帳號？登入',
                },
                sign_up: {
                  email_label: '電子郵件',
                  password_label: '密碼',
                  button_label: '註冊',
                  loading_button_label: '註冊中...',
                  social_provider_text: '使用 {{provider}} 註冊',
                  link_text: '還沒有帳號？註冊',
                  confirmation_text: '確認郵件已發送，請檢查您的收件匣',
                },
                forgotten_password: {
                  email_label: '電子郵件',
                  password_label: '密碼',
                  button_label: '重設密碼',
                  loading_button_label: '發送中...',
                  link_text: '忘記密碼？',
                  confirmation_text: '重設密碼郵件已發送',
                },
              },
            }}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

