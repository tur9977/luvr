"use client"

import { useState } from "react"
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

export function ProfileEditDialog() {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenSquare className="h-4 w-4 mr-2" />
          編輯資料
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯個人資料</DialogTitle>
          <DialogDescription>更新您的個人資料以展示真實的自己</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>封面圖片</Label>
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">上傳中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">點擊或拖曳圖片至此處</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>頭像</Label>
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">上傳中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">點擊或拖曳圖片至此處</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">名稱</Label>
            <Input id="name" defaultValue="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">所在地</Label>
            <Input id="location" defaultValue="台北市" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">個人簡介</Label>
            <Textarea
              id="bio"
              defaultValue="熱愛生活，熱愛分享。喜歡攝影、旅行和美食。讓我們一起創造美好的回憶！"
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">取消</Button>
          <Button>儲存變更</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

