"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "@/hooks/useProfile"

interface EventReminderProps {
  eventId: string
  eventDate: string
}

export function EventReminder({ eventId, eventDate }: EventReminderProps) {
  const [reminderTime, setReminderTime] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { profile } = useProfile()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchReminderSetting()
    }
  }, [profile, eventId])

  const fetchReminderSetting = async () => {
    try {
      const { data, error } = await supabase
        .from("event_notifications")
        .select("remind_before")
        .eq("event_id", eventId)
        .eq("user_id", profile?.id)
        .single()

      if (error) throw error
      if (data) {
        setReminderTime(data.remind_before)
      }
    } catch (error) {
      console.error("Error fetching reminder setting:", error)
    }
  }

  const handleSetReminder = async (value: string) => {
    if (!profile) {
      toast({
        title: "請先登入",
        description: "設置提醒需要先登入帳號",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("event_notifications")
        .upsert({
          event_id: eventId,
          user_id: profile.id,
          remind_before: value,
          notification_sent: false,
        })

      if (error) throw error

      setReminderTime(value)
      toast({
        title: "提醒已設置",
        description: "我們會在活動開始前通知您",
      })
    } catch (error) {
      console.error("Error setting reminder:", error)
      toast({
        title: "設置失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Bell className="h-4 w-4" />
      <Select
        value={reminderTime}
        onValueChange={handleSetReminder}
        disabled={loading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="設置提醒時間" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1 hour">活動前 1 小時</SelectItem>
          <SelectItem value="3 hours">活動前 3 小時</SelectItem>
          <SelectItem value="1 day">活動前 1 天</SelectItem>
          <SelectItem value="3 days">活動前 3 天</SelectItem>
          <SelectItem value="1 week">活動前 1 週</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 