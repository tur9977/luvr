"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import Script from "next/script"

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (element: HTMLElement | string, options: { sitekey: string; callback: (token: string) => void }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

// 使用環境變量中的 site key
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    username: "",
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  useEffect(() => {
    // 當 window.grecaptcha 可用時初始化
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        try {
          window.grecaptcha.render('recaptcha-container', {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (token: string) => {
              setRecaptchaToken(token)
            }
          })
        } catch (error) {
          console.error('reCAPTCHA initialization error:', error)
        }
      })
    }
  }, [])

  // 處理登入
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("請先驗證您的電子郵件地址", {
            action: {
              label: "重新發送驗證信",
              onClick: () => handleResendVerification(loginData.email),
            },
          })
          return
        }
        throw error
      }

      toast.success("登入成功！")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      toast.error("登入失敗：" + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 處理重新發送驗證郵件
  const handleResendVerification = async (email: string) => {
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
      toast.success("驗證郵件已重新發送，請檢查您的信箱")
    } catch (error) {
      console.error("Resend error:", error)
      toast.error("發送失敗：" + (error as Error).message)
    } finally {
      setResendLoading(false)
    }
  }

  // 處理註冊
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!recaptchaToken) {
      toast.error("請先完成驗證碼驗證")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            username: registerData.username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("Too Many Requests")) {
          const waitTime = error.message.match(/\d+/)?.[0] || "60"
          toast.error(`請等待 ${waitTime} 秒後再試一次`, {
            duration: 5000,
          })
          return
        }
        throw error
      }

      if (data?.user?.identities?.length === 0) {
        toast.error("此電子郵件已經註冊過了，請直接登入或使用其他電子郵件。")
        return
      }

      toast.success(
        "註冊成功！請檢查您的信箱以驗證帳號。如果沒有收到驗證信，請檢查垃圾郵件資料夾。",
        { 
          duration: 6000,
          action: {
            label: "重新發送驗證信",
            onClick: () => handleResendVerification(registerData.email),
          },
        }
      )
      router.push("/auth?tab=login")
    } catch (error) {
      console.error("Register error:", error)
      if ((error as Error).message.includes("unique constraint")) {
        toast.error("此電子郵件已經註冊過了，請直接登入或使用其他電子郵件。")
      } else if ((error as Error).message.includes("Too Many Requests")) {
        const waitTime = (error as Error).message.match(/\d+/)?.[0] || "60"
        toast.error(`請等待 ${waitTime} 秒後再試一次`, {
          duration: 5000,
        })
      } else {
        toast.error("註冊失敗：" + (error as Error).message)
      }
    } finally {
      setIsLoading(false)
      // 重置驗證碼
      try {
        window.grecaptcha?.reset()
        setRecaptchaToken(null)
      } catch (error) {
        console.error('Error resetting reCAPTCHA:', error)
      }
    }
  }

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="beforeInteractive"
      />
      <main className="container max-w-md mx-auto p-4 pt-8">
        <Tabs defaultValue={searchParams.get("tab") || "login"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登入</TabsTrigger>
            <TabsTrigger value="register">註冊</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>歡迎回來</CardTitle>
                <CardDescription>登入您的帳號以繼續使用所有功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">電子郵件</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密碼</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" variant="purple" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登入中...
                      </>
                    ) : (
                      "登入"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>創建帳號</CardTitle>
                <CardDescription>加入我們的社群，認識新朋友</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用戶名稱</Label>
                    <Input
                      id="username"
                      placeholder="您想要的顯示名稱"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">電子郵件</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">密碼</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">密碼至少需要 6 個字元</p>
                  </div>
                  <div className="space-y-2">
                    <div id="recaptcha-container" className="flex justify-center"></div>
                    {!recaptchaToken && (
                      <p className="text-sm text-red-500">請完成驗證碼驗證</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    variant="purple" 
                    className="w-full" 
                    disabled={isLoading || !recaptchaToken}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        註冊中...
                      </>
                    ) : (
                      "註冊"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

