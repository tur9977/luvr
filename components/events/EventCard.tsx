"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CalendarIcon, MapPinIcon, UserIcon } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { Database } from "@/lib/types/database.types"

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

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const getParticipantCount = (status: string) => {
    return event.participants?.filter(p => p.status === status).length || 0
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/events/${event.id}`} className="block">
        {event.cover_url && (
          <div className="relative h-48 bg-muted">
            <Image
              src={event.cover_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        <CardFooter className="flex flex-col gap-2">
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
            <span>{getParticipantCount("going")} 人參加</span>
            <span>{getParticipantCount("interested")} 人感興趣</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  )
} 