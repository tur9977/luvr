"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Share2 } from "lucide-react"

interface EventActionsProps {
  eventId: string | null | undefined
  isOwner: boolean
  onShare: () => void
}

export function EventActions({ eventId, isOwner, onShare }: EventActionsProps) {
  if (!eventId) return null

  return (
    <div className="flex items-center gap-2">
      {isOwner && (
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
  )
} 