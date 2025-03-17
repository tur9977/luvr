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
    
    return query
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      search: "",
      location: "",
      startDate: null,
      endDate: null,
      eventType: "all",
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
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">活動列表</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={toggleFilters}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            篩選
            {activeFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          {profile && (
            <Button asChild>
              <Link href="/create?tab=event">建立活動</Link>
            </Button>
          )}
        </div>
      </div>

      {/* 筛选面板 */}
      <div className={`mb-6 overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="border rounded-md p-4 bg-card">
          <EventFilters
            filters={filters}
            setFilters={setFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </div>
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
          {activeFiltersCount > 0 ? (
            <>
              <p className="text-muted-foreground">沒有符合條件的活動</p>
              <Button className="mt-4" variant="outline" onClick={handleResetFilters}>
                清除篩選條件
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">目前還沒有活動</p>
              {profile && (
                <Button className="mt-4" asChild>
                  <Link href="/create?tab=event">建立第一個活動</Link>
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
} 