"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "登入成功",
        variant: "default",
      })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing in:', error)
      toast({
        title: "登入失敗",
        description: "請檢查您的郵箱和密碼是否正確",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "密碼不匹配",
        description: "請確認兩次輸入的密碼相同",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?type=signup`,
        },
      })

      if (error) throw error

      toast({
        title: "註冊成功",
        description: "請檢查您的郵箱以完成驗證",
        variant: "default",
      })
    } catch (error) {
      console.error('Error signing up:', error)
      toast({
        title: "註冊失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?type=recovery`,
      })

      if (error) throw error

      toast({
        title: "重設密碼郵件已發送",
        description: "請檢查您的郵箱",
        variant: "default",
      })
      setCooldown(60)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: "發送失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              LUVR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">登入</TabsTrigger>
                <TabsTrigger value="register">註冊</TabsTrigger>
                <TabsTrigger value="reset">忘記密碼</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      歡迎回來
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      登入您的帳號以繼續使用所有功能
                    </p>
                  </div>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">電子郵件</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">密碼</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "登入中..." : "登入"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      創建帳號
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      註冊一個新帳號以開始使用
                    </p>
                  </div>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">電子郵件</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">密碼</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">確認密碼</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "註冊中..." : "註冊"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="reset">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      忘記密碼
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      輸入您的電子郵件，我們將發送重設密碼的連結
                    </p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">電子郵件</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || cooldown > 0}
                    >
                      {isLoading ? "發送中..." : 
                       cooldown > 0 ? `重新發送 (${cooldown}s)` : "發送重設連結"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 