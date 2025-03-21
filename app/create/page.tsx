"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ImageIcon, ImagePlus, Loader2, Tag, VideoIcon, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function CreatePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { profile } = useProfile()
  const { user } = useUser()
  const [date, setDate] = useState<Date>()
  const [isUploading, setIsUploading] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<MediaType | null>(null)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventCoverFile, setEventCoverFile] = useState<File | null>(null)
  const [eventCoverPreview, setEventCoverPreview] = useState<string | null>(null)
  const [eventType, setEventType] = useState("social")
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

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
        description: "請重新登入後再試",
      })
      return
    }

    // 檢查媒體文件
    if (!mediaFiles.length || !mediaType) {
      console.error('Missing media:', { mediaFiles, mediaType })
      toast({
        variant: "destructive",
        title: "請選擇媒體文件",
        description: "您需要上傳圖片或視頻",
      })
      return
    }

    try {
      setIsUploading(true)
      console.log('Starting upload process with files:', mediaFiles.map(f => ({ name: f.name, type: f.type, size: f.size })))

      // 上傳媒體文件
      const mediaItems = await Promise.all(
        mediaFiles.map(async (file, index) => {
          const mediaExt = file.name.split(".").pop()
          const mediaPath = `${profile.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${mediaExt}`
          console.log('Processing file:', { mediaPath, type: file.type })

          let aspectRatio = 1
          let duration = null

          try {
            // 獲取媒體文件的寬高比和時長
            const isImage = file.type.startsWith('image/')
            if (isImage) {
              aspectRatio = await new Promise<number>((resolve) => {
                const img = document.createElement('img')
                img.onload = () => {
                  const ratio = img.width / img.height
                  URL.revokeObjectURL(img.src)
                  resolve(ratio)
                }
                img.src = URL.createObjectURL(file)
              })
              console.log('Image aspect ratio:', aspectRatio)
            } else {
              const video = document.createElement('video')
              video.preload = 'metadata'
              await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => {
                  duration = Math.round(video.duration)
                  aspectRatio = video.videoWidth / video.videoHeight
                  URL.revokeObjectURL(video.src)
                  resolve()
                }
                video.src = URL.createObjectURL(file)
              })
              console.log('Video metadata:', { duration, aspectRatio })
            }

            // 上傳文件
            console.log('Uploading file to storage:', { mediaPath })
            const { error: uploadError } = await supabase.storage
              .from('posts')
              .upload(mediaPath, file)

            if (uploadError) {
              console.error('Upload error:', uploadError)
              throw uploadError
            }

            // 獲取公開訪問 URL
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(mediaPath)

            console.log('File uploaded successfully:', { publicUrl })

            return {
              media_url: publicUrl,
              media_type: isImage ? 'image' : 'video',
              aspect_ratio: aspectRatio,
              duration: duration,
              order: index
            }
          } catch (error) {
            console.error('Error processing file:', error)
            throw new Error(`處理文件 ${file.name} 時出錯: ${error instanceof Error ? error.message : '未知錯誤'}`)
          }
        })
      )

      console.log('All media items processed:', mediaItems)

      // 創建貼文
      const postData = {
        user_id: profile.id,
        caption: caption.trim(),
        location: location.trim()
      }
      
      console.log('Creating post with data:', postData)

      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(`發布貼文失敗: ${insertError.message}`)
      }

      console.log('Post created successfully:', post)

      // 創建媒體記錄
      const mediaRecords = mediaItems.map(item => ({
        post_id: post.id,
        media_url: item.media_url,
        media_type: item.media_type,
        aspect_ratio: Number(item.aspect_ratio),
        duration: item.duration,
        order: item.order
      }))

      console.log('Creating media records:', mediaRecords)

      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaRecords)

      if (mediaError) {
        console.error('Media insert error:', mediaError)
        // 如果媒體插入失敗，刪除已創建的貼文
        await supabase.from('posts').delete().eq('id', post.id)
        throw new Error(`添加媒體文件失敗: ${mediaError.message}`)
      }

      console.log('Media records created successfully')

      toast({
        title: "發布成功",
        description: "您的貼文已成功發布",
      })

      // 重置表單
      setMediaFiles([])
      setMediaPreviews([])
      setMediaType(null)
      setCaption("")
      setLocation("")
      
      // 導航到首頁
      router.push('/')
      router.refresh()

    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast({
        variant: "destructive",
        title: "發布失敗",
        description: error instanceof Error ? error.message : "發布貼文時出錯，請稍後再試",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearMedia = useCallback(() => {
    mediaPreviews.forEach(url => URL.revokeObjectURL(url))
    setMediaFiles([])
    setMediaPreviews([])
    setMediaType(null)
  }, [mediaPreviews])

  const handleEventCoverSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 檢查文件類型
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      toast({
        variant: "destructive",
        title: "不支援的文件類型",
        description: "請上傳圖片文件",
      })
      return
    }

    // 檢查文件大小（10MB 限制）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "文件太大",
        description: "請上傳小於 10MB 的圖片",
      })
      return
    }

    setEventCoverFile(file)
    const previewUrl = URL.createObjectURL(file)
    setEventCoverPreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [toast])

  const handleEventCoverDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    if (!isImage) {
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

    setEventCoverFile(file)
    const previewUrl = URL.createObjectURL(file)
    setEventCoverPreview(previewUrl)
  }, [toast])

  const clearEventCover = useCallback(() => {
    if (eventCoverPreview) {
      URL.revokeObjectURL(eventCoverPreview)
    }
    setEventCoverFile(null)
    setEventCoverPreview(null)
  }, [eventCoverPreview])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能創建活動",
      })
      return
    }

    if (!eventTitle || !date || !eventDescription || !eventLocation) {
      toast({
        variant: "destructive",
        title: "請填寫完整資訊",
        description: "活動名稱、日期、說明和地點為必填項目",
      })
      return
    }

    try {
      setIsCreatingEvent(true)

      let coverUrl = null
      if (eventCoverFile) {
        // 上傳封面圖片
        const fileExt = eventCoverFile.name.split(".").pop()
        const filePath = `events/${profile.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, eventCoverFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: eventCoverFile.type
          })

        if (uploadError) {
          console.error("封面圖片上傳錯誤:", uploadError)
          throw new Error(`封面圖片上傳失敗: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from("posts")
          .getPublicUrl(filePath)

        coverUrl = publicUrl
      }

      // 創建活動
      const { data: eventData, error: insertError } = await supabase
        .from("events")
        .insert({
          title: eventTitle,
          description: eventDescription,
          date: date?.toISOString(),
          location: eventLocation,
          cover_url: coverUrl,
          user_id: profile.id,
          event_type: eventType,
        })
        .select()
        .single()

      if (insertError) {
        console.error("活動創建錯誤:", insertError.message)
        throw new Error("活動創建失敗")
      }

      toast({
        title: "創建成功",
        description: "活動已成功創建",
      })

      // 重置表單
      setEventTitle("")
      setEventDescription("")
      setDate(undefined)
      setEventLocation("")
      setEventCoverFile(null)
      setEventCoverPreview(null)
      setEventType("social")

      // 導航到新創建的活動頁面
      router.push(`/events/${eventData.id}`)
      router.refresh()
    } catch (error) {
      console.error("完整錯誤詳情:", error)
      toast({
        variant: "destructive",
        title: "創建失敗",
        description: error instanceof Error ? error.message : "創建過程中發生錯誤，請稍後再試",
      })
    } finally {
      setIsCreatingEvent(false)
    }
  }

  // EVENT_TYPES 常量（與篩選組件中保持一致，但不包含 'all' 選項）
  const EVENT_TYPES = [
    { value: "social", label: "社交聚會" },
    { value: "sports", label: "運動活動" },
    { value: "education", label: "教育講座" },
    { value: "entertainment", label: "娛樂表演" },
    { value: "business", label: "商業交流" },
    { value: "other", label: "其他" },
  ]

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
                    className={cn(
                      "relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50",
                      isUploading && "pointer-events-none opacity-50"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">上傳中...</p>
                      </div>
                    ) : mediaPreviews.length > 0 ? (
                      <div className="relative w-full h-full">
                        {mediaType === "image" && mediaPreviews.length > 1 ? (
                          <div className="relative w-full h-48">
                            <Swiper
                              modules={[Navigation, Pagination]}
                              navigation
                              pagination={{ clickable: true }}
                              className="h-full rounded-lg"
                              spaceBetween={0}
                            >
                              {mediaPreviews.map((preview, index) => (
                                <SwiperSlide key={index} className="relative h-48">
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <Image
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      fill
                                      className="object-contain"
                                      priority={index === 0}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <Button
                                      type="button"
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
                        ) : mediaType === "video" ? (
                          <div className="relative w-full h-full">
                            <video
                              src={mediaPreviews[0]}
                              className="w-full h-full object-contain"
                              controls
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 z-10"
                              onClick={() => removeMedia(0)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative w-full h-48">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Image
                                src={mediaPreviews[0]}
                                alt="Preview"
                                fill
                                className="object-contain"
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 z-10"
                                onClick={() => removeMedia(0)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          multiple
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
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">活動名稱</Label>
                  <Input
                    id="event-title"
                    placeholder="輸入活動名稱"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>活動類型</Label>
                  <Select
                    value={eventType}
                    onValueChange={setEventType}
                  >
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="活動類型" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>活動日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>活動封面</Label>
                  <div
                    className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleEventCoverDrop}
                  >
                    {isCreatingEvent ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">上傳中...</p>
                      </div>
                    ) : eventCoverPreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={eventCoverPreview}
                          alt="Event cover preview"
                          fill
                          className="object-cover rounded-lg"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={clearEventCover}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleEventCoverSelect}
                        />
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          點擊或拖曳圖片至此處
                        </p>
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-description">活動說明</Label>
                  <Textarea
                    id="event-description"
                    placeholder="描述活動內容..."
                    className="min-h-[100px]"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-location">活動地點</Label>
                  <Input
                    id="event-location"
                    placeholder="輸入活動地點"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreatingEvent}
                >
                  {isCreatingEvent ? "創建中..." : "建立活動"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

// 獲取圖片寬高比
const getImageAspectRatio = (file: File): Promise<number> => {
  return new Promise<number>((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      resolve(img.width / img.height)
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

// 獲取視頻寬高比
const getVideoAspectRatio = (file: File): Promise<number> => {
  return new Promise<number>((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(video.videoWidth / video.videoHeight)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

// 獲取視頻時長（秒）
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise<number>((resolve) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration))
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

