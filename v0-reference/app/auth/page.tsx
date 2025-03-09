"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const supabase = createClient()

  // 登入表單數據
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // 註冊表單數據
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    username: "",
  })

  // 處理登入
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      toast.success("登入成功！")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("登入失敗：" + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 處理註冊
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. 創建認證用戶
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: registerData.username,
          },
        },
      })

      if (error) throw error

      // 2. 顯示驗證郵件已發送的訊息
      setVerificationSent(true)
      toast.success("註冊成功！請查看您的郵箱進行驗證。")
    } catch (error) {
      toast.error("註冊失敗：" + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 驗證成功後的內容
  if (verificationSent) {
    return (
      <main className="container max-w-md mx-auto p-4 pt-8">
        <Card>
          <CardHeader>
            <CardTitle>驗證您的電子郵件</CardTitle>
            <CardDescription>我們已發送驗證郵件至 {registerData.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  請查看您的收件匣並點擊驗證連結以完成註冊。 如果沒有收到郵件，請檢查垃圾郵件資料夾。
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setVerificationSent(false)}>
                返回登入
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
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
            <CardContent>
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
                <Button type="submit" className="w-full bg-[#8A6FD4] hover:bg-[#7857C8]" disabled={isLoading}>
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
            <CardContent>
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
                <Button type="submit" className="w-full bg-[#8A6FD4] hover:bg-[#7857C8]" disabled={isLoading}>
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
  )
}

