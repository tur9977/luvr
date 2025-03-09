"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 使用 signInWithPassword 方法
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!user) {
        throw new Error("登入失敗：找不到用戶")
      }

      // 檢查是否是管理員
      const { data: roles, error: adminError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)

      if (adminError) {
        console.error('檢查管理員權限失敗:', adminError)
        throw new Error("檢查管理員權限失敗")
      }

      if (!roles || roles.length === 0) {
        // 如果不是管理員，先登出
        await supabase.auth.signOut()
        throw new Error("無權限訪問管理員後台")
      }

      toast({
        title: "登入成功",
        description: "歡迎回來，管理員",
      })

      // 重新整理頁面以更新 session
      router.refresh()
      // 導向管理員儀表板
      router.push('/admin')
    } catch (error) {
      console.error('登入失敗:', error)
      toast({
        variant: "destructive",
        title: "登入失敗",
        description: error instanceof Error ? error.message : "請檢查您的帳號密碼",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container max-w-lg mx-auto p-4 h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>管理員登入</CardTitle>
          <CardDescription>
            請輸入您的管理員帳號密碼
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="請輸入電子郵件"
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
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登入中..." : "登入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
} 