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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { format, subMonths } from "date-fns"
import { zhTW } from "date-fns/locale"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const twoMonthsAgo = subMonths(new Date(), 2).toISOString()
      
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles:creator_id (
            username,
            avatar_url
          )
        `)
        .gte("date", twoMonthsAgo)
        .order("date", { ascending: true })

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", selectedEvent.id)

      if (error) throw error

      setEvents(events.filter(event => event.id !== selectedEvent.id))
      setShowDeleteDialog(false)
      setSelectedEvent(null)
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

  const activeEvents = events.filter(event => 
    ["upcoming", "ongoing"].includes(event.status)
  )
  
  const pastEvents = events.filter(event => 
    ["completed", "cancelled"].includes(event.status)
  )

  if (loading) {
    return <div>載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">活動管理</h2>
          <p className="text-muted-foreground">
            管理所有活動，包括查看、編輯和刪除
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">進行中的活動</h3>
          <div className="grid gap-4">
            {activeEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {event.cover_url && (
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                          <Image
                            src={event.cover_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), "PPP", { locale: zhTW })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          主辦人：{event.profiles.username || "未知用戶"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {getStatusText(event.status)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">已結束的活動</h3>
          <div className="grid gap-4">
            {pastEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {event.cover_url && (
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                          <Image
                            src={event.cover_url}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), "PPP", { locale: zhTW })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          主辦人：{event.profiles.username || "未知用戶"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {getStatusText(event.status)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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