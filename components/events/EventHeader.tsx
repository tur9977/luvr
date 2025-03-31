"use client"

import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon, Share2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

interface EventHeaderProps {
  title: string
  date: string
  location?: string | null | undefined
  eventId: string | null | undefined
  isOwner: boolean
  onShare: () => void
}

export function EventHeader({
  title,
  date,
  location,
  eventId,
  isOwner,
  onShare,
}: EventHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <time dateTime={date}>
            {format(new Date(date), "PPP", { locale: zhTW })}
          </time>
        </div>
        {location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{location}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {eventId && isOwner && (
          <Link href={`/events/${eventId}/edit`}>
            <Button variant="outline" size="sm">編輯活動</Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 