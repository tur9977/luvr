"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon, UserIcon, Share2 } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EventComments } from "@/components/event-comments"
import { EventPhotos } from "@/components/event-photos"
import { EventReminder } from "@/components/event-reminder"
import { EventCalendarSync } from "@/components/event-calendar-sync"
import { cn } from "@/lib/utils"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
  participants: {
    status: string
    user_id: string
    profiles: {
      username: string | null
      avatar_url: string | null
    }
  }[]
}

type Comment = {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    avatar_url: string | null
    full_name: string | null
    username: string | null
  }
}

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

// 添加 Supabase 返回的原始照片类型
type PhotoFromSupabase = {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  caption: string | null
  created_at: string
  updated_at: string
}

// 添加 Supabase 返回的原始事件类型
type EventFromSupabase = Omit<Database["public"]["Tables"]["events"]["Row"], "profiles"> & {
  profiles?: Array<{
    username: string | null
    avatar_url: string | null
  }> | null
  participants?: Array<{
    status: string
    user_id: string
    profiles?: Array<{
      username: string | null
      avatar_url: string | null
    }> | null
  }> | null
}

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [participating, setParticipating] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const { profile } = useProfile()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    if (!id || id === 'page.tsx') {
      router.push('/events')
      return
    }
    fetchEvent()
  }, [id, router])

  const fetchEvent = async () => {
    if (!id || id === 'page.tsx') return

    try {
      // 獲取活動基本信息
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("id", id)
        .single()

      if (eventError) throw eventError

      // 自動更新活動狀態
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const eventDate = new Date(eventData.date)
      eventDate.setHours(0, 0, 0, 0)
      
      let newStatus = eventData.status
      
      // 如果活動不是已取消狀態，則根據日期更新狀態
      if (eventData.status !== "cancelled") {
        if (eventDate.getTime() === today.getTime()) {
          newStatus = "ongoing"
        } else if (eventDate.getTime() < today.getTime()) {
          newStatus = "completed"
        } else {
          newStatus = "upcoming"
        }
        
        // 如果狀態有變化，更新數據庫
        if (newStatus !== eventData.status) {
          const { error: updateError } = await supabase
            .from("events")
            .update({ status: newStatus })
            .eq("id", id)

          if (updateError) {
            console.error("Error updating event status:", updateError)
          } else {
            eventData.status = newStatus
          }
        }
      }

      // 獲取活動參與者
      const { data: participants, error: participantsError } = await supabase
        .from("event_participants")
        .select(`
          status,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("event_id", id)

      if (participantsError) {
        console.error("Error fetching participants:", participantsError)
      }

      // 处理 eventData.profiles 为数组的情况
      const eventProfiles = eventData.profiles && Array.isArray(eventData.profiles) 
        ? eventData.profiles[0] || { username: null, avatar_url: null }
        : eventData.profiles || { username: null, avatar_url: null };
      
      // 处理参与者的 profiles 数组
      const transformedParticipants = (participants || []).map(participant => {
        const participantProfiles = participant.profiles && Array.isArray(participant.profiles)
          ? participant.profiles[0] || { username: null, avatar_url: null }
          : participant.profiles || { username: null, avatar_url: null };
          
        return {
          status: participant.status,
          user_id: participant.user_id,
          profiles: participantProfiles
        };
      });

      // 獲取活動評論
      const { data: commentsData, error: commentsError } = await supabase
        .from("event_comments")
        .select(`
          id,
          event_id,
          user_id,
          content,
          created_at,
          updated_at
        `)
        .eq("event_id", id)
        .order("created_at", { ascending: false })

      if (commentsError) {
        console.error("Error fetching comments:", commentsError)
      }

      // 獲取評論者的個人資料
      const commentUserIds = (commentsData || []).map(comment => comment.user_id)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, avatar_url, full_name, username")
        .in("id", commentUserIds)

      // 將個人資料數據與評論數據合併
      const transformedComments = (commentsData || []).map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id)
        return {
          ...comment,
          profiles: {
            avatar_url: profile?.avatar_url || null,
            full_name: profile?.full_name || null,
            username: profile?.username || null
          }
        }
      })

      // 獲取活動照片
      const { data: photosData, error: photosError } = await supabase
        .from("event_photos")
        .select(`
          id,
          event_id,
          user_id,
          photo_url,
          caption,
          created_at,
          updated_at
        `)
        .eq("event_id", id)
        .order("created_at", { ascending: false })

      if (photosError) {
        console.error("Error fetching photos:", photosError)
      }

      // 获取照片上传者的个人资料
      const photoUserIds = (photosData || []).map(photo => photo.user_id)
      let photoProfilesData = null
      if (photoUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, avatar_url, full_name, username")
          .in("id", photoUserIds)
        
        photoProfilesData = profilesData
      }

      // 转换照片数据，确保 profiles 字段格式正确
      const transformedPhotos = (photosData || []).map((photo: PhotoFromSupabase) => {
        const profile = photoProfilesData?.find(p => p.id === photo.user_id)
        
        return {
          id: photo.id,
          event_id: photo.event_id,
          user_id: photo.user_id,
          photo_url: photo.photo_url,
          caption: photo.caption,
          created_at: photo.created_at,
          updated_at: photo.updated_at,
          profiles: {
            avatar_url: profile?.avatar_url || null,
            full_name: profile?.full_name || null,
            username: profile?.username || null
          }
        } as Photo;
      })

      setEvent({
        ...eventData,
        participants: transformedParticipants
      })
      setComments(transformedComments)
      setPhotos(transformedPhotos)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入活動資訊",
      })
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  const getParticipantCount = (status: string) => {
    return event?.participants?.filter(p => p.status === status).length || 0
  }

  const getUserEventStatus = () => {
    if (!profile || !event) return null
    return event.participants?.find(p => p.user_id === profile.id)?.status || null
  }

  const handleParticipate = async (status: string) => {
    if (!profile || !event) return

    try {
      setParticipating(true)
      const currentStatus = getUserEventStatus()

      if (currentStatus === status) {
        // 取消參與
        const { error } = await supabase
          .from("event_participants")
          .delete()
          .eq("event_id", event.id)
          .eq("user_id", profile.id)

        if (error) throw error

        toast({
          title: "已取消",
          description: "您已取消參與此活動",
        })
      } else {
        // 新增或更新參與狀態
        const { error } = await supabase
          .from("event_participants")
          .upsert({
            event_id: event.id,
            user_id: profile.id,
            status,
          })

        if (error) throw error

        toast({
          title: "成功",
          description: status === "going" ? "您已報名參加此活動" : "您已標記對此活動感興趣",
        })
      }

      fetchEvent()
    } catch (error) {
      console.error("Error updating participation:", error)
      toast({
        variant: "destructive",
        title: "操作失敗",
        description: "無法更新參與狀態，請稍後再試",
      })
    } finally {
      setParticipating(false)
    }
  }

  const handleShare = () => {
    setShowShareDialog(true)
  }

  const handleCopyLink = async () => {
    if (!event) return

    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      toast({
        title: "已複製",
        description: "活動連結已複製到剪貼簿",
      })
      setShowShareDialog(false)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        variant: "destructive",
        title: "複製失敗",
        description: "無法複製活動連結",
      })
    }
  }

  const handleShareToSocial = (platform: string) => {
    if (!event) return

    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(event.title)
    const description = encodeURIComponent(event.description || "")

    let shareUrl = ""
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${title}%20${url}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        break
      case "email":
        shareUrl = `mailto:?subject=${title}&body=${description}%0A%0A${url}`
        break
      default:
        return
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer")
    setShowShareDialog(false)
  }

  if (loading) {
    return (
      <main className="container max-w-2xl mx-auto p-4 pt-8">
        <Card className="animate-pulse">
          <div className="h-64 bg-muted" />
          <CardContent className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
            <div className="h-20 bg-muted rounded" />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="container max-w-2xl mx-auto p-4 pt-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">找不到此活動</p>
          <Button className="mt-4" asChild>
            <Link href="/events">返回活動列表</Link>
          </Button>
        </div>
      </main>
    )
  }

  const currentStatus = getUserEventStatus()
  const isOwner = profile?.id === event.user_id

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      <Card className="overflow-hidden">
        {event.cover_url && (
          <div className="relative h-64 bg-muted">
            <Image
              src={event.cover_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                title="分享活動"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <time dateTime={event.date}>
                {format(new Date(event.date), "PPP", { locale: zhTW })}
              </time>
              <EventReminder eventId={event.id} eventDate={event.date} />
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinIcon className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/profile/${event.user_id}`}
              className="flex items-center gap-2 hover:underline"
            >
              {event.profiles.avatar_url ? (
                <Image
                  src={event.profiles.avatar_url}
                  alt={event.profiles.username || ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="h-6 w-6" />
              )}
              <span>{event.profiles.username || "未知用戶"}</span>
            </Link>
            <span className="text-muted-foreground">建立</span>
          </div>

          <p className="text-muted-foreground whitespace-pre-wrap">
            {event.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{getParticipantCount("going")} 人參加</span>
            <span>{getParticipantCount("interested")} 人感興趣</span>
          </div>

          {event.participants && event.participants.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">參與者</h2>
              <div className="flex flex-wrap gap-2">
                {event.participants.map((participant) => (
                  <HoverCard key={participant.user_id}>
                    <HoverCardTrigger asChild>
                      <Link
                        href={`/profile/${participant.user_id}`}
                        className="inline-block"
                      >
                        <Avatar>
                          <AvatarImage src={participant.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {participant.profiles.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={participant.profiles.avatar_url || undefined} />
                          <AvatarFallback>
                            {participant.profiles.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{participant.profiles.username || "未知用戶"}</p>
                          <p className="text-xs text-muted-foreground">
                            {participant.status === "going" ? "參加" : "感興趣"}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {!isOwner && (
              <>
                <Button
                  onClick={() => handleParticipate("going")}
                  disabled={participating}
                  className={cn(
                    "bg-[#8A6FD4] hover:bg-[#7857C8]",
                    currentStatus === "going" && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {currentStatus === "going" ? "已報名參加" : "我要參加"}
                </Button>
                <Button
                  onClick={() => handleParticipate("interested")}
                  disabled={participating}
                  variant="outline"
                  className={cn(
                    currentStatus === "interested" && "bg-blue-100 border-blue-300"
                  )}
                >
                  {currentStatus === "interested" ? "已感興趣" : "我感興趣"}
                </Button>
              </>
            )}
            <div className="ml-auto">
              <EventCalendarSync
                eventTitle={event.title}
                eventDate={event.date}
                eventLocation={event.location}
                eventDescription={event.description}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>共用</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareToSocial("facebook")}
                >
                  <Image
                    src="/icons/facebook.svg"
                    alt="Facebook"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareToSocial("twitter")}
                >
                  <Image
                    src="/icons/twitter.svg"
                    alt="Twitter"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Twitter
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareToSocial("whatsapp")}
                >
                  <Image
                    src="/icons/whatsapp.svg"
                    alt="WhatsApp"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareToSocial("linkedin")}
                >
                  <Image
                    src="/icons/linkedin.svg"
                    alt="LinkedIn"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  LinkedIn
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => handleShareToSocial("email")}
              >
                <Image
                  src="/icons/email.svg"
                  alt="Email"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                透過電子郵件分享
              </Button>
              <Button onClick={handleCopyLink}>
                複製連結
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">活動相片</h2>
        {id && <EventPhotos eventId={id} photos={photos} />}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">活動評論</h2>
        {id && <EventComments eventId={id} comments={comments} />}
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{event?.title}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              event?.status === "draft"
                ? "bg-gray-100 text-gray-800"
                : event?.status === "upcoming"
                ? "bg-blue-100 text-blue-800"
                : event?.status === "ongoing"
                ? "bg-green-100 text-green-800"
                : event?.status === "completed"
                ? "bg-purple-100 text-purple-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {event?.status === "draft"
              ? "草稿"
              : event?.status === "upcoming"
              ? "即將開始"
              : event?.status === "ongoing"
              ? "進行中"
              : event?.status === "completed"
              ? "已結束"
              : "已取消"}
          </span>
        </div>
        {profile && event?.user_id === profile.id && (
          <Link href={`/events/${params.id}/edit`}>
            <Button>編輯活動</Button>
          </Link>
        )}
      </div>
    </main>
  )
} 