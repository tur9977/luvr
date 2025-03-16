"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon, UserIcon } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/components/ui/use-toast"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  profiles: {
    username: string | null
    avatar_url: string | null
  }
  participants: {
    status: string
    user_id: string
  }[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useProfile()
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order("date", { ascending: true })

      if (eventsError) throw eventsError

      // 獲取每個活動的參與者
      const eventsWithParticipants = await Promise.all(
        eventsData.map(async (event) => {
          const { data: participants, error: participantsError } = await supabase
            .from("event_participants")
            .select("status, user_id")
            .eq("event_id", event.id)

          if (participantsError) {
            console.error("Error fetching participants:", participantsError)
            return { ...event, participants: [] }
          }

          return { ...event, participants: participants || [] }
        })
      )

      setEvents(eventsWithParticipants)
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
    return event.participants?.filter(p => p.status === status).length || 0
  }

  const getUserEventStatus = (event: Event) => {
    if (!profile) return null
    return event.participants?.find(p => p.user_id === profile.id)?.status || null
  }

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">活動列表</h1>
        {profile && (
          <Button asChild>
            <Link href="/create?tab=event">建立活動</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48 bg-muted" />
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/events/${event.id}`} className="block">
                {event.cover_url && (
                  <div className="relative h-48 bg-muted">
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
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <time dateTime={event.date}>
                        {format(new Date(event.date), "PPP", { locale: zhTW })}
                      </time>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {event.profiles.avatar_url ? (
                      <Image
                        src={event.profiles.avatar_url}
                        alt={event.profiles.username || ""}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                    <span>{event.profiles.username || "未知用戶"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{getParticipantCount(event, "going")} 人參加</span>
                    <span>{getParticipantCount(event, "interested")} 人感興趣</span>
                  </div>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">目前還沒有活動</p>
          {profile && (
            <Button className="mt-4" asChild>
              <Link href="/create?tab=event">建立第一個活動</Link>
            </Button>
          )}
        </div>
      )}
    </main>
  )
} 