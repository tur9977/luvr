"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import NextImage from "next/image"

interface EventCardProps {
  title: string
  date: string
  description: string
  imageUrl: string
}

export function EventCard({ title, date, description, imageUrl }: EventCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          <NextImage
            src={imageUrl}
            alt={title}
            width={600}
            height={200}
            className="w-full object-cover h-48"
          />
          <div className="absolute top-4 left-4 bg-background/90 rounded-lg p-2 backdrop-blur">
            <p className="text-sm font-semibold">{title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {date}
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm">{description}</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm">我要參加</Button>
            <Button variant="outline" size="sm">
              了解更多
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 