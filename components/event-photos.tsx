"use client"

import { useState } from "react"
import Image from "next/image"
import { useProfile } from "@/hooks/useProfile"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Camera, Loader2, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Photo = {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  caption: string | null
  created_at: string
  updated_at: string
  profiles: {
    avatar_url: string | null
    full_name: string | null
    username: string | null
  }
}

// 添加 Supabase 返回的照片类型
type PhotoFromSupabase = {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  caption: string | null
  created_at: string
  updated_at: string
}

interface EventPhotosProps {
  eventId: string
  photos: Photo[]
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function EventPhotos({ eventId, photos: initialPhotos }: EventPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const { profile } = useProfile()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 檢查文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error("檔案大小不能超過 5MB")
      return
    }

    // 檢查文件類型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("只支援 JPG、PNG 和 WebP 格式的圖片")
      return
    }

    // 創建預覽
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // 檢查文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error("檔案大小不能超過 5MB")
      return
    }

    // 檢查文件類型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("只支援 JPG、PNG 和 WebP 格式的圖片")
      return
    }

    // 創建預覽
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // 将拖放的文件设置到文件输入框
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (fileInput) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.files = dataTransfer.files
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast.error("請先登入")
      return
    }

    const fileInput = document.querySelector<HTMLInputElement>('#photo')
    const file = fileInput?.files?.[0]
    if (!file) {
      toast.error("請選擇要上傳的照片")
      return
    }

    setIsUploading(true)
    try {
      // 上傳照片到 Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `event-photos/${eventId}/${fileName}`

      console.log('Uploading file:', file)
      console.log('File path:', filePath)

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("photos")
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      // 獲取照片的公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)

      // 將照片信息保存到數據庫
      const { data: photoData, error: insertError } = await supabase
        .from("event_photos")
        .insert({
          event_id: eventId,
          user_id: profile.id,
          photo_url: publicUrl,
          caption: caption.trim() || null,
        })
        .select(`
          id,
          event_id,
          user_id,
          photo_url,
          caption,
          created_at,
          updated_at
        `)
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      console.log('Insert successful:', photoData)

      // 获取用户资料
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, username")
        .eq("id", profile.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      // 转换照片数据，确保 profiles 字段格式正确
      const transformedPhoto: Photo = {
        id: photoData.id,
        event_id: photoData.event_id,
        user_id: photoData.user_id,
        photo_url: photoData.photo_url,
        caption: photoData.caption,
        created_at: photoData.created_at,
        updated_at: photoData.updated_at,
        profiles: {
          avatar_url: profileData?.avatar_url || null,
          full_name: profileData?.full_name || null,
          username: profileData?.username || null
        }
      };

      setPhotos((prev) => [transformedPhoto, ...prev])
      setUploadDialog(false)
      setPreviewUrl(null)
      setCaption("")
      toast.success("照片上傳成功")
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast.error("照片上傳失敗")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      // 從 Storage 中刪除照片
      const urlParts = photoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `event-photos/${eventId}/${fileName}`;

      await supabase.storage
        .from("photos")
        .remove([filePath]);

      // 從數據庫中刪除記錄
      const { error } = await supabase
        .from("event_photos")
        .delete()
        .eq("id", photoId)

      if (error) throw error

      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
      setSelectedPhoto(null)
      toast.success("照片已刪除")
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast.error("刪除照片失敗")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span className="font-medium">{photos.length} 張照片</span>
        </div>
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <ImagePlus className="mr-2 h-4 w-4" />
              上傳照片
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上傳活動照片</DialogTitle>
              <DialogDescription>
                分享活動的精彩時刻。支援 JPG、PNG 和 WebP 格式，檔案大小不超過 5MB。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">照片</Label>
                <div 
                  className={`relative aspect-video rounded-lg border-2 border-dashed ${isDragging ? 'border-primary' : 'border-muted-foreground/25 hover:border-muted-foreground/50'} transition-colors`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                  />
                  {previewUrl ? (
                    <div className="relative aspect-video">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ width: "100%", height: "100%" }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-50"
                        onClick={() => setPreviewUrl(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground pointer-events-none">
                      <ImagePlus className="h-8 w-8" />
                      <span>點擊或拖曳照片至此</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">說明文字（選填）</Label>
                <Textarea
                  id="caption"
                  placeholder="為這張照片添加說明..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadDialog(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={!previewUrl || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    "上傳"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>還沒有照片，來分享第一張照片吧！</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Image
                  src={photo.photo_url}
                  alt={photo.caption || "活動照片"}
                  fill
                  priority={true}
                  className="object-cover transition-transform group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  style={{ width: "100%", height: "100%" }}
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-sm text-white line-clamp-2">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="sr-only">查看活動照片</DialogTitle>
              </DialogHeader>
              {selectedPhoto && (
                <div className="space-y-4">
                  <div className="relative aspect-video">
                    <Image
                      src={selectedPhoto.photo_url}
                      alt={selectedPhoto.caption || "活動照片"}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">
                        {selectedPhoto.profiles.full_name || selectedPhoto.profiles.username}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedPhoto.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                    </div>
                    {profile?.id === selectedPhoto.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(selectedPhoto.id, selectedPhoto.photo_url)}
                      >
                        刪除
                      </Button>
                    )}
                  </div>
                  {selectedPhoto.caption && (
                    <p className="text-sm">{selectedPhoto.caption}</p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
} 