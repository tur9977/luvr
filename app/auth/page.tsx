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
      render: (element: HTMLElement | string, options: { 
        sitekey: string; 
        callback: (token: string) => void;
        'expired-callback'?: () => void;
      }) => number;
      reset: (widgetId?: number) => void;
      execute: (sitekey: string, options: { action: string }) => Promise<string>;
    };
    onRecaptchaLoad: () => void;
  }
}

// 使用環境變量中的 site key
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfXPfcqAAAAAM1V7rr_Nrt3nvSc89jkbIOTuuLJ"

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
  const [resetData, setResetData] = useState({
    email: "",
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // 定义全局回调函数
  useEffect(() => {
    console.log("Auth page mounted, initializing reCAPTCHA with site key:", RECAPTCHA_SITE_KEY);
    
    // 为reCAPTCHA API定义全局回调
    window.onRecaptchaLoad = () => {
      try {
        console.log("reCAPTCHA API loaded successfully");
        const recaptchaContainer = document.getElementById('recaptcha-container');
        
        if (!recaptchaContainer) {
          const errorMsg = "Failed to find recaptcha-container element";
          console.error(errorMsg);
          setRecaptchaError(errorMsg);
          return;
        }
        
        if (!window.grecaptcha) {
          const errorMsg = "grecaptcha is not available";
          console.error(errorMsg);
          setRecaptchaError(errorMsg);
          return;
        }
        
        try {
          const widgetId = window.grecaptcha.render('recaptcha-container', {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (token: string) => {
              console.log("reCAPTCHA verified with token:", token.substring(0, 10) + "...");
              setRecaptchaToken(token);
              setRecaptchaError(null);
            },
            'expired-callback': () => {
              console.log("reCAPTCHA expired");
              setRecaptchaToken(null);
              setRecaptchaError("驗證已過期，請重新驗證");
            }
          });
          console.log("reCAPTCHA widget rendered with ID:", widgetId);
          setRecaptchaWidgetId(widgetId);
        } catch (renderError: unknown) {
          console.error('reCAPTCHA render error:', renderError);
          setRecaptchaError(`渲染錯誤: ${renderError instanceof Error ? renderError.message : "未知錯誤"}`);
        }
      } catch (error: unknown) {
        console.error('reCAPTCHA initialization error:', error);
        setRecaptchaError(`初始化錯誤: ${error instanceof Error ? error.message : "未知錯誤"}`);
      }
    };

    // 检查grecaptcha是否已加载
    const checkAndInitRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        console.log("grecaptcha is ready, calling onRecaptchaLoad");
        window.grecaptcha.ready(() => {
          window.onRecaptchaLoad();
        });
      } else {
        console.log("grecaptcha not ready yet, will rely on onload callback");
      }
    };
    
    // 首次尝试初始化
    checkAndInitRecaptcha();
    
    // 清理函数
    return () => {
      window.onRecaptchaLoad = () => {
        console.log("Cleaned up onRecaptchaLoad callback");
      };
    };
  }, []);

  // 檢查是否是從驗證郵件跳轉回來的
  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast.success("您的帳號已成功驗證！現在可以登入了。", { duration: 6000 });
    }
  }, [searchParams]);

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
      // 先刷新頁面，再跳轉
      window.location.href = "/"
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
      // 使用 window.location.href 進行頁面跳轉
      window.location.href = "/auth?tab=login"
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

  // 處理忘記密碼
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success(
        "密碼重設連結已發送到您的電子郵件。請檢查您的信箱。",
        { duration: 6000 }
      )
      router.push("/auth?tab=login")
    } catch (error) {
      console.error("Reset password error:", error)
      toast.error("密碼重設郵件發送失敗：" + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`}
        strategy="afterInteractive"
        onLoad={() => console.log("reCAPTCHA script loaded")}
        onError={(e) => {
          console.error("reCAPTCHA script failed to load", e);
          setRecaptchaError("驗證碼腳本加載失敗");
        }}
      />
      <main className="container max-w-md mx-auto p-4 pt-8">
        <Tabs defaultValue={searchParams.get("tab") || "login"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">登入</TabsTrigger>
            <TabsTrigger value="register">註冊</TabsTrigger>
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
                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm text-muted-foreground"
                    onClick={() => router.push("/auth?tab=reset")}
                  >
                    忘記密碼？
                  </Button>
                </div>
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
                    <div id="recaptcha-container" className="flex justify-center mb-2"></div>
                    {!recaptchaToken && (
                      <p className="text-sm text-red-500 text-center">
                        {recaptchaError || "請完成驗證碼驗證"}
                      </p>
                    )}
                    {recaptchaToken && (
                      <p className="text-sm text-green-500 text-center">驗證碼已通過</p>
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

          <TabsContent value="reset">
            <Card>
              <CardHeader>
                <CardTitle>忘記密碼</CardTitle>
                <CardDescription>輸入您的電子郵件以接收密碼重設連結</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Button type="submit" variant="purple" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </>
  )
}

