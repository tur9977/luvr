"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EventCalendarSyncProps {
  eventTitle: string
  eventDate: string
  eventLocation?: string
  eventDescription: string
}

export function EventCalendarSync({
  eventTitle,
  eventDate,
  eventLocation,
  eventDescription,
}: EventCalendarSyncProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGoogleCalendarSync = () => {
    try {
      // 構建 Google Calendar 事件 URL
      const eventStartDate = new Date(eventDate)
      const eventEndDate = new Date(eventStartDate)
      eventEndDate.setHours(eventEndDate.getHours() + 2) // 預設活動時長 2 小時

      const googleCalendarUrl = new URL("https://calendar.google.com/calendar/render")
      googleCalendarUrl.searchParams.append("action", "TEMPLATE")
      googleCalendarUrl.searchParams.append("text", eventTitle)
      googleCalendarUrl.searchParams.append("dates", 
        `${eventStartDate.toISOString().replace(/[-:.]/g, "").slice(0, 8)}T${eventStartDate.toISOString().slice(11, 13)}0000` +
        "/" +
        `${eventEndDate.toISOString().replace(/[-:.]/g, "").slice(0, 8)}T${eventEndDate.toISOString().slice(11, 13)}0000`
      )
      if (eventLocation) {
        googleCalendarUrl.searchParams.append("location", eventLocation)
      }
      googleCalendarUrl.searchParams.append("details", eventDescription)

      // 在新視窗中打開 Google Calendar
      window.open(googleCalendarUrl.toString(), "_blank")

      toast({
        title: "Google 日曆同步",
        description: "請在新開啟的視窗中完成同步",
      })
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error)
      toast({
        title: "同步失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    }
  }

  const handleOutlookSync = () => {
    try {
      const eventStartDate = new Date(eventDate)
      const eventEndDate = new Date(eventStartDate)
      eventEndDate.setHours(eventEndDate.getHours() + 2)

      const outlookUrl = new URL("https://outlook.office.com/calendar/0/deeplink/compose")
      outlookUrl.searchParams.append("subject", eventTitle)
      outlookUrl.searchParams.append("startdt", eventStartDate.toISOString())
      outlookUrl.searchParams.append("enddt", eventEndDate.toISOString())
      if (eventLocation) {
        outlookUrl.searchParams.append("location", eventLocation)
      }
      outlookUrl.searchParams.append("body", eventDescription)

      window.open(outlookUrl.toString(), "_blank")
      toast({
        title: "Outlook 日曆同步",
        description: "請在新開啟的視窗中完成同步",
      })
    } catch (error) {
      console.error("Error syncing with Outlook:", error)
      toast({
        title: "同步失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    }
  }

  const handleAppleCalendarSync = () => {
    try {
      const eventStartDate = new Date(eventDate)
      const eventEndDate = new Date(eventStartDate)
      eventEndDate.setHours(eventEndDate.getHours() + 2)

      // 生成 .ics 文件內容
      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${eventTitle}`,
        `DTSTART:${eventStartDate.toISOString().replace(/[-:.]/g, "").slice(0, 13)}00Z`,
        `DTEND:${eventEndDate.toISOString().replace(/[-:.]/g, "").slice(0, 13)}00Z`,
        eventLocation ? `LOCATION:${eventLocation}` : "",
        `DESCRIPTION:${eventDescription}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\n")

      // 創建並下載 .ics 文件
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute("download", `${eventTitle}.ics`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Apple 日曆同步",
        description: "請開啟下載的 .ics 文件以添加到日曆",
      })
    } catch (error) {
      console.error("Error creating ICS file:", error)
      toast({
        title: "同步失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={loading}
        >
          <CalendarIcon className="h-4 w-4" />
          加到日曆
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleGoogleCalendarSync}>
          Google 日曆
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookSync}>
          Outlook 日曆
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAppleCalendarSync}>
          Apple 日曆
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 