"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Ban, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export function BannedUserOverlay() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // 防止用戶通過瀏覽器後退按鈕繞過禁封頁面
  useEffect(() => {
    history.pushState(null, "", window.location.href)
    window.onpopstate = function () {
      history.pushState(null, "", window.location.href)
    }
    return () => {
      window.onpopstate = null
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <Ban className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-red-600">帳號已被禁用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-center text-base space-y-4">
            <p>
              您的帳號因違反社區規範已被禁用。
              如有任何疑問，請聯繫客服人員。
            </p>
            <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                禁用期間將無法使用平台的所有功能，包括發布內容、參與互動等。
                如需申訴，請發送郵件至 support@example.com
              </p>
            </div>
          </CardDescription>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
          >
            登出
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 