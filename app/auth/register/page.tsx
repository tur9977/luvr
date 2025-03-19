"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import Script from "next/script"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    username: "",
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  // 初始化 reCAPTCHA
  useEffect(() => {
    console.log("Register page mounted, initializing reCAPTCHA with site key:", RECAPTCHA_SITE_KEY)
    
    window.onRecaptchaLoad = () => {
      try {
        console.log("reCAPTCHA API loaded successfully")
        const recaptchaContainer = document.getElementById('recaptcha-container')
        
        if (!recaptchaContainer) {
          const errorMsg = "Failed to find recaptcha-container element"
          console.error(errorMsg)
          setRecaptchaError(errorMsg)
          return
        }
        
        if (!window.grecaptcha) {
          const errorMsg = "grecaptcha is not available"
          console.error(errorMsg)
          setRecaptchaError(errorMsg)
          return
        }
        
        try {
          const widgetId = window.grecaptcha.render('recaptcha-container', {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: (token: string) => {
              console.log("reCAPTCHA verified with token:", token.substring(0, 10) + "...")
              setRecaptchaToken(token)
              setRecaptchaError(null)
            },
            'expired-callback': () => {
              console.log("reCAPTCHA expired")
              setRecaptchaToken(null)
              setRecaptchaError("驗證已過期，請重新驗證")
            }
          })
          console.log("reCAPTCHA widget rendered with ID:", widgetId)
          setRecaptchaWidgetId(widgetId)
        } catch (renderError: unknown) {
          console.error('reCAPTCHA render error:', renderError)
          setRecaptchaError(`渲染錯誤: ${renderError instanceof Error ? renderError.message : "未知錯誤"}`)
        }
      } catch (error: unknown) {
        console.error('reCAPTCHA initialization error:', error)
        setRecaptchaError(`初始化錯誤: ${error instanceof Error ? error.message : "未知錯誤"}`)
      }
    }

    const checkAndInitRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        console.log("grecaptcha is ready, calling onRecaptchaLoad")
        window.grecaptcha.ready(() => {
          window.onRecaptchaLoad()
        })
      } else {
        console.log("grecaptcha not ready yet, will rely on onload callback")
      }
    }
    
    checkAndInitRecaptcha()
    
    return () => {
      window.onRecaptchaLoad = () => {
        console.log("Cleaned up onRecaptchaLoad callback")
      }
    }
  }, [])

  // 處理註冊
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!agreedToTerms) {
      toast.error("請閱讀並同意會員註冊協議")
      setIsLoading(false)
      return
    }

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
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
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
      window.location.href = "/auth/login"
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

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`}
        strategy="afterInteractive"
        onLoad={() => console.log("reCAPTCHA script loaded")}
        onError={(e) => {
          console.error("reCAPTCHA script failed to load", e)
          setRecaptchaError("驗證碼腳本加載失敗")
        }}
      />
      <main className="container max-w-md mx-auto p-4 pt-8">
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
                    aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                    title={showPassword ? "隱藏密碼" : "顯示密碼"}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" aria-hidden="true" /> : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
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

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  我已閱讀並同意
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="link" 
                        className="px-1 h-auto font-normal underline"
                      >
                        會員註冊協議
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Luvr 會員註冊協議</DialogTitle>
                        <DialogDescription>
                          生效日期：2025年2月25日
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 text-sm">
                        <p>感謝您選擇加入Luvr（以下簡稱「我們」或「本網站」）。</p>

                        <div>
                          <h3 className="font-bold mb-2">1. 個人資料的收集與使用</h3>
                          <h4 className="font-semibold">1.1 我們收集的數據</h4>
                          <p>為了提供服務並保護社群安全，我們可能會收集以下個人資訊：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>電子郵件地址、手機號碼、使用者名稱；</li>
                            <li>性別認同（可選）、個人簡介；</li>
                            <li>您上傳的內容（如照片、文字或其他媒體）。</li>
                          </ul>
                          <p>這些資料將用於建立號碼、認證、社群互動及改善使用者的體驗。</p>
                        </div>

                        <div>
                          <h4 className="font-semibold">1.2 資料使用目的</h4>
                          <p>您的個人資訊將用於以下目的：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>確認您的身份，確保社區環境安全；</li>
                            <li>提供個人化功能和服務；</li>
                            <li>處理您的問題、投訴或投訴；</li>
                            <li>通知您有關編號或服務重要更新。</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold">1.3 商業用途的選擇同意</h4>
                          <p>我們可能會根據您個人的需求使用本網站的商家廣告或銷售相關活動，包括但不限於：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>推播一個人力資源優惠或活動通知；</li>
                            <li>與合作夥伴分享促進銷售資訊。</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold">1.4 資料分享</h4>
                          <p>除非取得您的明確同意或法律要求，我們不會將您的個人資料分享給第三方。</p>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">2. 使用者權益</h3>
                          <h4 className="font-semibold">2.1 資料存取與修改</h4>
                          <p>您有權隨時查看、更正或刪除您的個人資訊。</p>

                          <h4 className="font-semibold mt-2">2.2 隱私選擇</h4>
                          <p>您可選擇公開或隱藏部分個人資訊（如性別認同或照片）。</p>

                          <h4 className="font-semibold mt-2">2.3 資料安全性</h4>
                          <p>我們採用業界標準的加密技術（如 SSL）來保護您的資料傳輸與儲存。</p>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">3. 使用者服務與行為規範</h3>
                          <h4 className="font-semibold">3.1 號碼使用</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>您應提供真實、準確的註冊信息，並妥善保管號碼與密碼。</li>
                            <li>禁止將號碼借予他人使用，若因號碼管理不當導致損失，由您自行承擔。</li>
                          </ul>

                          <h4 className="font-semibold mt-2">3.2 內容規範</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>您傳遞的內容不得違反(台灣)中華民國法律或侵害他人權益，包括但不限於兒童、青少年、暴力、仇恨言論或脅迫行為。</li>
                            <li>若您的內容被撤回並經審查屬實，我們有權移除內容並暫停或終止您的帳號。</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">4. 免責聲明</h3>
                          <h4 className="font-semibold">4.1 內容義務</h4>
                          <p>本網站提供平台供使用者交流，但不得對所有使用者的上傳內容進行即時審查。</p>

                          <h4 className="font-semibold mt-2">4.2 服務限制</h4>
                          <p>我們致力於提供嚴格的服務，但不保證網站永遠沒有故障或中斷。</p>

                          <h4 className="font-semibold mt-2">4.3 第三方鏈接</h4>
                          <p>本站可能包含外部鏈接，我們對其內容或隱私措施不承擔任何責任。</p>

                          <h4 className="font-semibold mt-2">4.4 法律限制</h4>
                          <p>本網站遵守(台灣)中華民國法律。</p>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">5. 協議更新與終止</h3>
                          <h4 className="font-semibold">5.1 協議更新</h4>
                          <p>我們保留隨時更新本協議的權限。</p>

                          <h4 className="font-semibold mt-2">5.2 服務終止</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>您可以隨時透過帳號設定申請終止服務，我們將根據您的要求刪除相關資料（(台灣)中華民國法律要求保留的除外）。</li>
                            <li>若您離開本協議，我們有權終止您的號碼並保留追究責任的權力。</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-bold mb-2">6. 同意聲明</h3>
                          <p>註冊並使用 Luvr 即表示您已閱讀、瞭解並同意本協議的所有條款，包括個人資料的使用以及未來本站內商業用途。</p>
                          <p className="mt-4">客服信箱：mx@mydouble.tw</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
              </div>

              <Button 
                type="submit" 
                variant="purple" 
                className="w-full" 
                disabled={isLoading || !recaptchaToken || !agreedToTerms}
                aria-label="註冊"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    註冊中...
                  </>
                ) : (
                  "註冊"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
} 