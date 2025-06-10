"use client"

import { useEffect, useState } from "react"
import { EventCard } from "./EventCard"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
  event_participants: {
    status: string
    user_id: string
  }[]
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      // 首先獲取活動數據
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          profiles:creator_id (
            username,
            avatar_url
          )
        `)
        .order("date", { ascending: true })
        .limit(3)

      if (eventsError) throw eventsError

      // 然後獲取這些活動的參與者數據
      if (eventsData && eventsData.length > 0) {
        const { data: participantsData, error: participantsError } = await supabase
          .from("event_participants")
          .select("*")
          .in("event_id", eventsData.map(event => event.id))

        if (participantsError) throw participantsError

        // 將參與者數據合併到活動數據中
        const eventsWithParticipants = eventsData.map(event => ({
          ...event,
          event_participants: participantsData?.filter(p => p.event_id === event.id) || []
        }))

        setEvents(eventsWithParticipants)
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入活動列表",
      })
    } finally {
      setLoading(false)
    }
  }

  const getParticipantCount = (event: Event, status: string) => {
    return event.event_participants?.filter(p => p.status === status).length || 0
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.length > 0 ? (
        <>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/events">查看更多活動</Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">目前還沒有活動</p>
          <Button className="mt-4" asChild>
            <Link href="/create?tab=event">建立第一個活動</Link>
          </Button>
        </div>
      )}
    </div>
  )
} 