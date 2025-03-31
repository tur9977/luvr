"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [resetData, setResetData] = useState({
    email: "",
  })

  // 處理冷卻時間
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [cooldown])

  // 處理登入
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 如果在冷卻時間內，不允許提交
    if (cooldown > 0) {
      toast.error(`請等待 ${cooldown} 秒後再試一次`)
      return
    }

    // 檢查輸入是否為空
    if (!loginData.email || !loginData.password) {
      toast.error("請填寫完整的登入資訊")
      return
    }

    setIsLoading(true)

    try {
      // 嘗試登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          toast.error("請先驗證您的電子郵件地址", {
            action: {
              label: "重新發送驗證信",
              onClick: () => handleResendVerification(loginData.email),
            },
          })
          return
        }
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("電子郵件或密碼錯誤")
          return
        }
        if (authError.message.includes("Too Many Requests") || authError.message.includes("Request rate limit reached")) {
          // 從錯誤消息中提取等待時間，如果無法提取則默認為 60 秒
          const waitTimeMatch = authError.message.match(/\d+/)
          const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[0]) : 60
          setCooldown(waitTime)
          
          toast.error(`登入請求過於頻繁`, {
            description: `請等待 ${waitTime} 秒後再試。\n\n如果您沒有頻繁登入但仍看到此消息，可能是因為：\n1. 您的網絡連接不穩定\n2. 系統正在維護中\n3. 您的 IP 地址被暫時限制`,
            duration: waitTime * 1000,
          })
          return
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error("登入失敗：無法獲取用戶資訊")
      }

      // 使用新的會話檢查用戶角色
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('檢查用戶角色失敗:', profileError)
        if (profileError.message.includes('No authorization')) {
          toast.error("登入過期，請重新登入")
          return
        }
      } else {
        console.log('用戶角色:', profile?.role)
        // 將用戶角色存儲在 localStorage 中
        localStorage.setItem('userRole', profile?.role || 'normal_user')
      }

      toast.success("登入成功！")
      
      // 使用 router.push 進行導航
      router.push('/')
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
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
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

  // 處理重設密碼
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetData.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) throw error

      toast.success("密碼重設連結已發送到您的信箱")
      // 使用 window.location.href 進行頁面跳轉
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error("發送重設連結失敗：" + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container max-w-md mx-auto p-4 pt-8">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">登入</TabsTrigger>
          <TabsTrigger value="reset">忘記密碼</TabsTrigger>
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
                    disabled={cooldown > 0}
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
                      disabled={cooldown > 0}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                      title={showPassword ? "隱藏密碼" : "顯示密碼"}
                      disabled={cooldown > 0}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" aria-hidden="true" /> : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  variant="purple" 
                  className="w-full" 
                  disabled={isLoading || cooldown > 0} 
                  aria-label="登入"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      登入中...
                    </>
                  ) : cooldown > 0 ? (
                    `請等待 ${cooldown} 秒`
                  ) : (
                    "登入"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reset">
          <Card>
            <CardHeader>
              <CardTitle>忘記密碼</CardTitle>
              <CardDescription>輸入您的電子郵件以接收密碼重設連結</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">電子郵件</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" variant="purple" className="w-full" disabled={isLoading} aria-label="發送重設連結">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      處理中...
                    </>
                  ) : (
                    "發送重設連結"
                  )}
                </Button>
              </form>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  已註冊但未驗證的電子郵件也可使用此功能重設密碼
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
} 