"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

const ADMIN_EMAIL = 'neal@mydouble.tw'
const INITIAL_PASSWORD = 'Admin@123456'

export default function AdminSetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [setupKey, setSetupKey] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, message])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLogs([])

    try {
      addLog('開始管理員設置流程...')

      // 驗證設置金鑰
      const setupKeyFromEnv = process.env.NEXT_PUBLIC_ADMIN_SETUP_KEY
      addLog(`檢查設置金鑰... (${setupKeyFromEnv})`)
      if (!setupKeyFromEnv || setupKey !== setupKeyFromEnv) {
        throw new Error("設置金鑰無效")
      }
      addLog('設置金鑰驗證成功')

      // 檢查是否已有超級管理員
      addLog('檢查是否已存在超級管理員...')
      const { count, error: countError } = await supabase
        .from('admin_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')

      if (countError) {
        console.error('檢查管理員數量錯誤:', countError)
        throw new Error("檢查管理員狀態失敗")
      }

      if (count && count > 0) {
        throw new Error("超級管理員已存在")
      }
      addLog('確認系統中尚無超級管理員')

      // 創建用戶
      addLog('開始創建管理員用戶...')
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: INITIAL_PASSWORD,
      })

      if (signUpError) {
        console.error('創建用戶錯誤:', signUpError)
        throw signUpError
      }

      if (!user) {
        throw new Error("用戶創建失敗")
      }
      addLog(`用戶創建成功，ID: ${user.id}`)

      // 創建用戶檔案
      addLog('創建用戶檔案...')
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username: 'admin',
        full_name: '系統管理員',
      })

      if (profileError) {
        console.error('創建用戶檔案錯誤:', profileError)
        throw new Error("創建用戶檔案失敗")
      }
      addLog('用戶檔案創建成功')

      // 設置超級管理員角色
      addLog('設置超級管理員角色...')
      const { error: roleError } = await supabase.from('admin_roles').insert({
        user_id: user.id,
        role: 'super_admin',
      })

      if (roleError) {
        console.error('設置角色錯誤:', roleError)
        throw new Error("設置管理員角色失敗")
      }
      addLog('超級管理員角色設置成功')

      addLog('所有設置步驟完成！')

      toast({
        title: "設置成功",
        description: `超級管理員帳號已創建！\n\n登入信息：\n郵箱：${ADMIN_EMAIL}\n密碼：${INITIAL_PASSWORD}\n\n請立即登入並修改密碼。`,
      })

      // 等待一下確保數據都已經寫入
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/admin/login')
    } catch (error) {
      console.error('設置錯誤:', error)
      addLog(`錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
      toast({
        variant: "destructive",
        title: "設置失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container max-w-lg mx-auto p-4 h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>初始化管理員</CardTitle>
          <CardDescription>
            設置系統的超級管理員帳號 ({ADMIN_EMAIL})。
            <br />
            此頁面只能使用一次，設置完成後將無法再次訪問。
            <br />
            <span className="text-primary">
              初始密碼將設置為：{INITIAL_PASSWORD}
              <br />
              請在登入後立即修改密碼！
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setupKey">設置金鑰</Label>
              <Input
                id="setupKey"
                type="password"
                placeholder="請輸入設置金鑰"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                設置金鑰可以在環境變數 NEXT_PUBLIC_ADMIN_SETUP_KEY 中設置
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "設置中..." : "設置超級管理員"}
            </Button>

            {/* 顯示設置日誌 */}
            {logs.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-medium mb-2">設置進度：</p>
                <div className="space-y-1 text-sm">
                  {logs.map((log, index) => (
                    <p key={index}>{log}</p>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
} 