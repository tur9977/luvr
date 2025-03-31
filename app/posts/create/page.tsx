"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, ImagePlus, Loader2, VideoIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useProfile } from '@/hooks/useProfile'
import Image from "next/image"
import { useUser } from "@/hooks/useUser"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import { processVideo } from "@/lib/utils/video"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

type MediaType = "image" | "video"

function isImageType(type: MediaType): type is "image" {
  return type === "image"
}

function isVideoType(type: MediaType): type is "video" {
  return type === "video"
}

export default function CreatePostPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { profile } = useProfile()
  const { user } = useUser()
  const [isUploading, setIsUploading] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<MediaType | null>(null)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")

  const removeMedia = useCallback((index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      return newFiles
    })
    setMediaPreviews(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index]) // 釋放 URL 對象
      newPreviews.splice(index, 1)
      return newPreviews
    })
    if (mediaFiles.length === 1) {
      setMediaType(null)
    }
  }, [mediaFiles])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // 檢查文件類型
    const isImage = files[0].type.startsWith("image/")
    const isVideo = files[0].type.startsWith("video/")

    if (!isImage && !isVideo) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片或視頻文件",
      })
      return
    }

    // 如果是圖片，檢查數量限制
    if (isImage && files.length > 4) {
      toast({
        variant: "destructive",
        title: "圖片數量過多",
        description: "最多只能上傳4張圖片",
      })
      return
    }

    try {
      // 直接使用原始文件，不進行處理
      setMediaFiles(files)
      setMediaType(isImage ? "image" : "video")

      // 創建預覽 URL
      const previewUrls = files.map(file => URL.createObjectURL(file))
      setMediaPreviews(previewUrls)
    } catch (error) {
      console.error("處理文件時出錯:", error)
      toast({
        variant: "destructive",
        title: "處理失敗",
        description: error instanceof Error ? error.message : "處理文件時出錯，請稍後再試",
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    const isImage = files[0].type.startsWith("image/")
    const isVideo = files[0].type.startsWith("video/")

    if (!isImage && !isVideo) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片或視頻文件",
      })
      return
    }

    // 如果是圖片，檢查數量限制
    if (isImage && files.length > 4) {
      toast({
        variant: "destructive",
        title: "圖片數量過多",
        description: "最多只能上傳4張圖片",
      })
      return
    }

    try {
      // 直接使用原始文件，不進行處理
      setMediaFiles(files)
      setMediaType(isImage ? "image" : "video")
      const previewUrls = files.map(file => URL.createObjectURL(file))
      setMediaPreviews(previewUrls)
    } catch (error) {
      console.error("處理文件時出錯:", error)
      toast({
        variant: "destructive",
        title: "處理失敗",
        description: error instanceof Error ? error.message : "處理文件時出錯，請稍後再試",
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 防止重複提交
    if (isUploading) {
      return
    }

    console.log('Submit button clicked')

    if (!user) {
      console.error('No user found')
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能發布貼文",
      })
      router.push('/auth/login')
      return
    }

    if (!profile) {
      console.error('No profile found')
      toast({
        variant: "destructive",
        title: "找不到用戶資料",
        description: "請確保您已完成註冊並設置個人資料",
      })
      return
    }

    if (!mediaFiles.length) {
      toast({
        variant: "destructive",
        title: "請選擇媒體文件",
        description: "您需要上傳至少一張圖片或一個視頻",
      })
      return
    }

    setIsUploading(true)

    try {
      // 1. 上傳媒體文件
      const mediaPromises = mediaFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // 獲取媒體文件的寬高比和時長（如果是視頻）
        let aspectRatio = 1
        let duration = null

        if (isImageType(mediaType)) {
          aspectRatio = await getImageAspectRatio(file)
        } else if (isVideoType(mediaType)) {
          aspectRatio = await getVideoAspectRatio(file)
          duration = await getVideoDuration(file)
        }

        return {
          media_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${fileName}`,
          media_type: mediaType,
          aspect_ratio: aspectRatio,
          duration,
          order: index
        }
      })

      const mediaData = await Promise.all(mediaPromises)

      // 2. 創建貼文
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: caption,
            location: location || null,
            content_type: 'post'
          }
        ])
        .select()
        .single()

      if (postError) throw postError

      // 3. 關聯媒體文件
      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(
          mediaData.map(media => ({
            post_id: post.id,
            ...media
          }))
        )

      if (mediaError) throw mediaError

      toast({
        title: "發布成功",
        description: "您的貼文已成功發布",
      })

      // 4. 重定向到首頁
      router.push('/')
      router.refresh()

    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        variant: "destructive",
        title: "發布失敗",
        description: error instanceof Error ? error.message : "發布貼文時出錯，請稍後再試",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>建立新貼文</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 媒體上傳區域 */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer relative min-h-[200px] flex flex-col items-center justify-center gap-2",
                mediaFiles.length > 0 && "border-none p-0"
              )}
            >
              {mediaFiles.length === 0 ? (
                <>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple={isImageType(mediaType) || !mediaType}
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      點擊或拖放文件到此處上傳
                    </p>
                    <p className="text-xs text-muted-foreground">
                      支持圖片和視頻文件
                    </p>
                  </div>
                </>
              ) : (
                <div className="relative w-full">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    className="aspect-[4/3] w-full rounded-lg overflow-hidden"
                  >
                    {mediaPreviews.map((preview, index) => (
                      <SwiperSlide key={preview}>
                        <div className="relative w-full h-full">
                          {isImageType(mediaType) ? (
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <video
                              src={preview}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => removeMedia(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>

            {/* 貼文內容 */}
            <div className="space-y-2">
              <Label htmlFor="caption">說點什麼...</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={isUploading}
              />
            </div>

            {/* 位置 */}
            <div className="space-y-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {/* 發布按鈕 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || !mediaFiles.length}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  發布中...
                </>
              ) : (
                "發布貼文"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

const getImageAspectRatio = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve(img.width / img.height)
    }
    img.src = URL.createObjectURL(file)
  })
}

const getVideoAspectRatio = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(video.videoWidth / video.videoHeight)
    }
    video.src = URL.createObjectURL(file)
  })
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(video.duration)
    }
    video.src = URL.createObjectURL(file)
  })
} 