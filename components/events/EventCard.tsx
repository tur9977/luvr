"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, Users } from "lucide-react"
import NextImage from "next/image"

interface EventCardProps {
  title: string
  date: string
  description: string
  imageUrl: string
  participants?: number
  interested?: number
}

export function EventCard({
  title,
  date,
  description,
  imageUrl,
  participants = 0,
  interested = 0
}: EventCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <NextImage
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm">{date}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{participants} 人參加</span>
          </div>
          {interested > 0 && (
            <span>{interested} 人感興趣</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 