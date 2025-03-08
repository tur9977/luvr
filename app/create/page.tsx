"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ImageIcon, Loader2, VideoIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useProfile } from '@/hooks/useProfile'
import Image from "next/image"
import { useUser } from "@/hooks/useUser"

export default function CreatePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { profile } = useProfile()
  const { user } = useUser()
  const [date, setDate] = useState<Date>()
  const [isUploading, setIsUploading] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 檢查文件類型
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片或視頻文件",
      })
      return
    }

    // 檢查文件大小（20MB 限制）
    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "文件太大",
        description: "請上傳小於 20MB 的文件",
      })
      return
    }

    setMediaFile(file)
    setMediaType(isImage ? "image" : "video")

    // 創建預覽 URL
    const previewUrl = URL.createObjectURL(file)
    setMediaPreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片或視頻文件",
      })
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "文件太大",
        description: "請上傳小於 20MB 的文件",
      })
      return
    }

    setMediaFile(file)
    setMediaType(isImage ? "image" : "video")
    const previewUrl = URL.createObjectURL(file)
    setMediaPreview(previewUrl)
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能發布貼文",
      })
      return
    }

    if (!mediaFile || !mediaType) {
      toast({
        variant: "destructive",
        title: "請選擇媒體文件",
        description: "您需要上傳圖片或視頻",
      })
      return
    }

    try {
      setIsUploading(true)
      console.log("開始上傳媒體文件...")

      // 上傳媒體文件
      const mediaExt = mediaFile.name.split(".").pop()
      const mediaPath = `${profile.id}/${Date.now()}.${mediaExt}`
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("posts")
        .upload(mediaPath, mediaFile)

      if (uploadError) {
        console.error("媒體文件上傳錯誤:", uploadError)
        throw uploadError
      }

      console.log("媒體文件上傳成功:", uploadData)

      // 獲取媒體 URL
      const { data: { publicUrl: mediaUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(mediaPath)

      console.log("獲取到媒體 URL:", mediaUrl)

      // 如果是視頻，生成縮圖
      let thumbnailUrl = null
      if (mediaType === "video") {
        console.log("開始生成視頻縮圖...")
        const video = document.createElement("video")
        video.src = URL.createObjectURL(mediaFile)
        await new Promise((resolve) => {
          video.onloadeddata = () => {
            video.currentTime = 1
            video.onseeked = resolve
          }
        })

        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(video, 0, 0)
        
        const thumbnailBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.7)
        })

        const thumbnailPath = `${profile.id}/${Date.now()}_thumb.jpg`
        const { error: thumbError, data: thumbData } = await supabase.storage
          .from("posts")
          .upload(thumbnailPath, thumbnailBlob)

        if (thumbError) {
          console.error("縮圖上傳錯誤:", thumbError)
          throw thumbError
        }

        console.log("縮圖上傳成功:", thumbData)

        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from("posts")
          .getPublicUrl(thumbnailPath)

        thumbnailUrl = thumbUrl
        console.log("獲取到縮圖 URL:", thumbnailUrl)
      }

      // 獲取媒體寬高比和時長
      console.log("開始計算媒體屬性...")
      const aspectRatio = mediaType === "video" 
        ? await getVideoAspectRatio(mediaFile)
        : await getImageAspectRatio(mediaFile)
      
      const duration = mediaType === "video" 
        ? await getVideoDuration(mediaFile) 
        : null

      console.log("媒體屬性:", { aspectRatio, duration })

      // 創建貼文
      console.log("開始創建貼文...")
      const now = new Date().toISOString()
      const { error: insertError, data: post } = await supabase
        .from("posts")
        .insert({
          user_id: profile.id,
          media_url: mediaUrl,
          media_type: mediaType,
          thumbnail_url: thumbnailUrl,
          aspect_ratio: aspectRatio,
          duration,
          caption,
          location,
          created_at: now,
        })
        .select(`
          *,
          profiles!fk_posts_profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single()

      if (insertError) {
        console.error("貼文創建錯誤:", insertError)
        throw insertError
      }

      console.log("貼文創建成功:", post)

      toast({
        title: "發布成功",
        description: "您的貼文已成功發布",
      })

      // 使用 replace 而不是 push，這樣用戶按返回鍵時不會回到發文頁面
      router.replace("/")
      router.refresh()
    } catch (error) {
      console.error("完整錯誤詳情:", error)
      toast({
        variant: "destructive",
        title: "發布失敗",
        description: error instanceof Error ? error.message : "上傳過程中發生錯誤，請稍後再試",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearMedia = useCallback(() => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
  }, [mediaPreview])

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      <Tabs defaultValue="post" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="post">發布貼文</TabsTrigger>
          <TabsTrigger value="event">建立活動</TabsTrigger>
        </TabsList>

        <TabsContent value="post">
          <Card>
            <CardHeader>
              <CardTitle>新貼文</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>上傳媒體</Label>
                  <div
                    className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">上傳中...</p>
                      </div>
                    ) : mediaPreview ? (
                      <div className="relative w-full h-full">
                        {mediaType === "image" ? (
                          <Image
                            src={mediaPreview}
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <video
                            src={mediaPreview}
                            className="w-full h-full object-contain"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={clearMedia}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                        />
                        <div className="flex gap-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <VideoIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          點擊或拖曳圖片/視頻至此處
                        </p>
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">內容</Label>
                  <Textarea
                    id="caption"
                    placeholder="分享你的想法..."
                    className="min-h-[100px]"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">地點</Label>
                  <Input
                    id="location"
                    placeholder="添加地點"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? "發布中..." : "發布"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event">
          <Card>
            <CardHeader>
              <CardTitle>建立活動</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">活動名稱</Label>
                <Input id="event-title" placeholder="輸入活動名稱" />
              </div>
              <div className="space-y-2">
                <Label>活動日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>活動封面</Label>
                <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50">
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
                <Label htmlFor="event-description">活動說明</Label>
                <Textarea id="event-description" placeholder="描述活動內容..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">活動地點</Label>
                <Input id="event-location" placeholder="輸入活動地點" />
              </div>
              <Button className="w-full">建立活動</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

// 獲取圖片寬高比
const getImageAspectRatio = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const img = document.createElement("img")
    img.onload = () => {
      resolve(img.width / img.height)
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

// 獲取視頻寬高比
const getVideoAspectRatio = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.onloadedmetadata = () => {
      resolve(video.videoWidth / video.videoHeight)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

// 獲取視頻時長（秒）
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration))
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

