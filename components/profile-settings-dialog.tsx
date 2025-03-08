"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Loader2 } from "lucide-react"
import type { Profile } from "@/lib/types/database.types"
import Image from "next/image"

interface ProfileSettingsDialogProps {
  profile: Profile
  children: React.ReactNode
}

export function ProfileSettingsDialog({ profile, children }: ProfileSettingsDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [formData, setFormData] = useState({
    username: profile.username || "",
    full_name: profile.full_name || "",
    location: profile.location || "",
    bio: profile.bio || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    // 獲取當前用戶的 email
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getCurrentUser()
  }, [])

  // 處理頭像上傳
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片文件",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "文件太大",
        description: "請上傳小於 10MB 的圖片",
      })
      return
    }

    console.log("選擇的檔案:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    })

    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  // 處理個人資料更新
  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)

      // 驗證密碼更新
      if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
        // 確保所有密碼欄位都有填寫
        if (!formData.currentPassword) {
          throw new Error("請輸入目前密碼")
        }
        if (!formData.newPassword) {
          throw new Error("請輸入新密碼")
        }
        if (!formData.confirmPassword) {
          throw new Error("請輸入確認密碼")
        }

        // 驗證新密碼
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("新密碼與確認密碼不符")
        }
        if (formData.newPassword.length < 6) {
          throw new Error("新密碼長度至少需要6個字符")
        }
        if (formData.newPassword === formData.currentPassword) {
          throw new Error("新密碼不能與目前密碼相同")
        }

        // 驗證當前密碼
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        if (getUserError) {
          console.error("獲取用戶信息失敗:", getUserError)
          throw new Error("獲取用戶信息失敗")
        }
        if (!user?.email) {
          throw new Error("無法獲取用戶信息")
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword,
        })

        if (signInError) {
          console.error("密碼驗證失敗:", signInError)
          throw new Error("目前密碼不正確")
        }
      }

      // 上傳新頭像（如果有）
      let newAvatarUrl = profile.avatar_url
      if (avatarFile) {
        try {
          console.log("開始上傳頭像...")

          // 生成安全的文件名
          const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
          const fileName = `${profile.id}_${Date.now()}.${fileExt}`

          console.log("準備上傳文件:", {
            fileName,
            fileType: avatarFile.type,
            fileSize: avatarFile.size
          })

          // 上傳新頭像
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: avatarFile.type
            })

          if (uploadError) {
            console.error("頭像上傳失敗:", {
              error: uploadError,
              message: uploadError.message
            })
            throw new Error(`頭像上傳失敗: ${uploadError.message}`)
          }

          console.log("文件上傳成功:", uploadData)

          // 獲取公開URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

          if (!publicUrl) {
            throw new Error("無法獲取頭像公開訪問地址")
          }

          newAvatarUrl = publicUrl

          console.log("獲取到公開URL:", newAvatarUrl)

          // 清除舊的預覽
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview)
          }

          // 更新預覽
          setAvatarPreview(newAvatarUrl)

          // 如果有舊頭像，嘗試刪除
          if (profile.avatar_url) {
            try {
              const oldFileName = profile.avatar_url.split('/').pop()
              if (oldFileName && oldFileName.includes(profile.id)) {
                console.log("嘗試刪除舊頭像:", oldFileName)
                await supabase.storage
                  .from('avatars')
                  .remove([oldFileName])
              }
            } catch (error) {
              console.warn("刪除舊頭像失敗，但不影響更新:", error)
            }
          }
        } catch (uploadError) {
          console.error("頭像處理過程出錯:", {
            error: uploadError,
            message: uploadError instanceof Error ? uploadError.message : "未知錯誤"
          })
          throw new Error(uploadError instanceof Error ? uploadError.message : "頭像上傳過程中出現錯誤")
        }
      }

      // 更新個人資料
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          full_name: formData.full_name,
          location: formData.location,
          bio: formData.bio,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("個人資料更新失敗:", updateError)
        throw new Error(updateError.message || "個人資料更新失敗")
      }

      // 如果有更改密碼
      if (formData.newPassword && formData.currentPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })

        if (passwordError) {
          console.error("密碼更新失敗:", passwordError)
          throw new Error("密碼更新失敗")
        }

        // 清除密碼欄位
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))
      }

      toast({
        title: "更新成功",
        description: "您的個人資料已更新",
      })

      // 強制更新頭像顯示
      const avatarImages = document.querySelectorAll('img[src*="' + profile.id + '"]')
      avatarImages.forEach(img => {
        const imgElement = img as HTMLImageElement
        imgElement.src = newAvatarUrl + '?t=' + Date.now()
      })

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("更新失敗:", error instanceof Error ? error.message : "未知錯誤", error)
      toast({
        variant: "destructive",
        title: "更新失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 處理登出
  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.refresh()
      router.push("/auth")
    } catch (error) {
      console.error("登出失敗:", error)
      toast({
        variant: "destructive",
        title: "登出失敗",
        description: "請稍後再試",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>個人資料設定</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">個人資料</TabsTrigger>
            <TabsTrigger value="account">帳號設定</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatarPreview || profile.avatar_url || "/placeholder.svg"}
                    alt={`${profile.username || 'User'}'s avatar`}
                    className="h-24 w-24 object-cover"
                  />
                  <AvatarFallback>
                    {(profile.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1 rounded-full bg-background border cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div className="w-full space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">用戶名稱</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="full_name">全名</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">地點</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">個人簡介</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    "更新資料"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>電子郵件</Label>
                <p className="text-sm text-muted-foreground border rounded-md p-2">
                  {userEmail || "未設置郵箱"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current-password">目前密碼</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">新密碼</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">確認新密碼</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                onClick={handleProfileUpdate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "更新資料"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 