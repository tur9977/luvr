"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CalendarIcon, ChevronDown, ChevronUp, Filter, MapPinIcon, UserIcon } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { PostgrestFilterBuilder } from "@supabase/postgrest-js"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/types/database.types"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/components/ui/use-toast"
import EventFilters, { EventFilters as EventFiltersType } from "@/components/event-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/events/EventCard"

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
  const [showFilters, setShowFilters] = useState(false)
  const { profile } = useProfile()
  const { toast } = useToast()

  // 初始化筛选器状态
  const [filters, setFilters] = useState<EventFiltersType>({
    search: "",
    location: "",
    startDate: null,
    endDate: null,
    eventType: "all",
    status: "active",
  })

  // 保存应用的筛选器
  const [appliedFilters, setAppliedFilters] = useState<EventFiltersType>(filters)

  useEffect(() => {
    fetchEvents()
  }, [appliedFilters])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // 创建基本查询
      let query = supabase
        .from("events")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
      
      // 应用筛选条件
      query = applyFilters(query)
      
      // 排序：默认按日期升序，但如果有搜索词，则按相关性排序
      if (appliedFilters.search) {
        query = query.order("title", { ascending: true })
      } else {
        query = query.order("date", { ascending: true })
      }
      
      const { data: eventsData, error: eventsError } = await query
      
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

  // 应用过滤条件到查询
  const applyFilters = (query: PostgrestFilterBuilder<any, any, any>) => {
    // 按标题和描述搜索
    if (appliedFilters.search) {
      const searchTerm = `%${appliedFilters.search}%`
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }
    
    // 按地点搜索
    if (appliedFilters.location) {
      query = query.ilike("location", `%${appliedFilters.location}%`)
    }
    
    // 按日期范围筛选
    if (appliedFilters.startDate) {
      const startDate = format(appliedFilters.startDate, "yyyy-MM-dd")
      query = query.gte("date", startDate)
    }
    
    if (appliedFilters.endDate) {
      // 将结束日期设为当天的23:59:59，以包括整天
      const endDate = format(appliedFilters.endDate, "yyyy-MM-dd") + "T23:59:59"
      query = query.lte("date", endDate)
    }
    
    // 按活动类型筛选
    if (appliedFilters.eventType && appliedFilters.eventType !== "all") {
      query = query.eq("event_type", appliedFilters.eventType)
    }

    // 按活動狀態篩選
    if (appliedFilters.status === "active") {
      query = query.in("status", ["upcoming", "ongoing"])
    } else if (appliedFilters.status === "completed") {
      query = query.in("status", ["completed", "cancelled"])
    }
    
    return query
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    const resetFilters: EventFiltersType = {
      search: "",
      location: "",
      startDate: null,
      endDate: null,
      eventType: "all",
      status: "active",
    }
    setFilters(resetFilters)
    setAppliedFilters(resetFilters)
  }

  const getParticipantCount = (event: Event, status: string) => {
    return event.participants?.filter(p => p.status === status).length || 0
  }

  const getUserEventStatus = (event: Event) => {
    if (!profile) return null
    return event.participants?.find(p => p.user_id === profile.id)?.status || null
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // 统计活跃的筛选器数量
  const getActiveFiltersCount = () => {
    let count = 0
    if (appliedFilters.search) count++
    if (appliedFilters.location) count++
    if (appliedFilters.startDate) count++
    if (appliedFilters.endDate) count++
    if (appliedFilters.eventType && appliedFilters.eventType !== "all") count++
    if (appliedFilters.status) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">活動列表</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            篩選
          </Button>
          {profile && (
            <Link href="/events/create">
              <Button>建立活動</Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="active" onValueChange={(value) => {
        const status = value as "active" | "completed"
        setFilters(prev => ({ ...prev, status }))
        setAppliedFilters(prev => ({ ...prev, status }))
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">進行中</TabsTrigger>
          <TabsTrigger value="completed">已結束</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {showFilters && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">篩選條件</h2>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    重置
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <EventFilters 
                  filters={filters} 
                  setFilters={setFilters}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                />
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <EventCard event={event} />
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <EventCard event={event} />
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 