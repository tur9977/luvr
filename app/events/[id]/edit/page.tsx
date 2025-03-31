"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { useProfile } from "@/hooks/useProfile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

type Event = Database["public"]["Tables"]["events"]["Row"]

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { profile } = useProfile()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    status: "draft" as Event["status"],
    max_participants: 0,
  })

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        status: event.status,
        max_participants: event.max_participants || 0,
      })
    }
  }, [event])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) throw error

      if (!data) {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: "找不到該活動",
        })
        router.push("/events")
        return
      }

      // 檢查權限
      if (data.user_id !== profile?.id) {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: "您沒有權限編輯此活動",
        })
        router.push("/events")
        return
      }

      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入活動資料",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!event) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("events")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          status: formData.status,
          max_participants: formData.max_participants,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id)

      if (error) throw error

      toast({
        title: "成功",
        description: "活動已更新",
      })

      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法更新活動",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id)

      if (error) throw error

      toast({
        title: "成功",
        description: "活動已刪除",
      })

      router.push("/events")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法刪除活動",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">載入中...</div>
  }

  if (!event) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>編輯活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">活動標題</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">活動描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={saving}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">活動地點</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">人數上限</Label>
              <Input
                id="max_participants"
                type="number"
                min={0}
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">活動狀態</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Event["status"]) => setFormData({ ...formData, status: value })}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
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
            </div>
            <div className="flex justify-between items-center pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">刪除活動</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確定要刪除此活動嗎？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作無法復原。活動將被永久刪除，包括所有相關的照片和評論。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={saving}>
                      {saving ? "刪除中..." : "確定刪除"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/events/${event.id}`)}
                  disabled={saving}
                >
                  返回
                </Button>
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 