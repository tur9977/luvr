"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Loader2, PenSquare } from "lucide-react"
import { useProfile } from "@/hooks/useProfile"
import { UserAvatar } from "@/components/ui/user-avatar"

export function ProfileEditDialog() {
  const { profile, updating, updateProfile, uploadAvatar } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    bio: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 當對話框打開時，初始化表單數據
  const handleDialogOpen = (open: boolean) => {
    if (open && profile) {
      setFormData({
        full_name: profile.full_name || "",
        location: profile.location || "",
        bio: profile.bio || "",
      })
    }
    setIsOpen(open)
  }

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile(formData)
    setIsOpen(false)
  }

  // 處理文件上傳
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadAvatar(file)
    }
  }

  // 處理拖放上傳
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadAvatar(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PenSquare className="h-4 w-4" />
          編輯資料
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯個人資料</DialogTitle>
          <DialogDescription>更新您的個人資料以展示真實的自己</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>頭像</Label>
            <div
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {updating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">上傳中...</p>
                </div>
              ) : profile?.avatar_url ? (
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar 
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    role={profile.role}
                    size="lg"
                    className="w-20 h-20"
                  />
                  <p className="text-sm text-muted-foreground">點擊或拖曳更換頭像</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">點擊或拖曳圖片至此處</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">名稱</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">所在地</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">個人簡介</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button
              type="submit"
              className="bg-[#8A6FD4] hover:bg-[#7857C8]"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                "儲存變更"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

