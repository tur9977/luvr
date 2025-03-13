"use client"

import { EventCard } from "./EventCard"

const MOCK_EVENTS = [
  {
    id: 1,
    title: "台北同志遊行",
    date: "2024年10月28日",
    description: "一年一度的台北同志遊行即將展開！讓我們一起為平等與愛發聲。",
    imageUrl: "/placeholder.svg"
  },
  {
    id: 2,
    title: "女同志電影放映會",
    date: "2024年9月15日",
    description: "一起來欣賞獲獎女同志電影，映後將有導演座談會。",
    imageUrl: "/placeholder.svg"
  }
]

export function EventList() {
  return (
    <div className="space-y-4">
      {MOCK_EVENTS.map((event) => (
        <EventCard
          key={event.id}
          title={event.title}
          date={event.date}
          description={event.description}
          imageUrl={event.imageUrl}
        />
      ))}
    </div>
  )
} 