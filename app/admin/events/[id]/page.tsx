"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

export default function AdminEventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      if (!data) {
        router.push("/admin/events")
        return
      }

      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Event["status"]) => {
    if (!event) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", event.id)

      if (error) throw error

      setEvent({ ...event, status: newStatus })
    } catch (error) {
      console.error("Error updating event status:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id)

      if (error) throw error

      router.push("/admin/events")
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "ongoing":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "草稿"
      case "upcoming":
        return "即將開始"
      case "ongoing":
        return "進行中"
      case "completed":
        return "已結束"
      case "cancelled":
        return "已取消"
      default:
        return status
    }
  }

  if (loading) {
    return <div>載入中...</div>
  }

  if (!event) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/events")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">活動詳情</h2>
            <p className="text-muted-foreground">
              查看和管理活動的詳細信息
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {event.cover_url && (
                <div className="relative h-48 w-48 overflow-hidden rounded-lg">
                  <Image
                    src={event.cover_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  主辦人：{event.profiles.username || "未知用戶"}
                </p>
                <p className="text-sm text-muted-foreground">
                  活動日期：{format(new Date(event.date), "PPP", { locale: zhTW })}
                </p>
                <p className="text-sm text-muted-foreground">
                  地點：{event.location}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">活動描述</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活動狀態</CardTitle>
            <CardDescription>
              更改活動的當前狀態
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={event.status}
              onValueChange={(value: Event["status"]) => handleStatusChange(value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="upcoming">即將開始</SelectItem>
                <SelectItem value="ongoing">進行中</SelectItem>
                <SelectItem value="completed">已結束</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此活動？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。這將永久刪除活動及其所有相關數據。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 