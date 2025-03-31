"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CalendarIcon, MapPinIcon, Search, Tag, X } from "lucide-react"

// 活动类型选项
const EVENT_TYPES = [
  { value: "all", label: "所有類型" },
  { value: "social", label: "社交聚會" },
  { value: "sports", label: "運動活動" },
  { value: "education", label: "教育講座" },
  { value: "entertainment", label: "娛樂表演" },
  { value: "business", label: "商業交流" },
  { value: "other", label: "其他" },
]

export type EventFilters = {
  search: string
  location: string
  startDate: Date | null
  endDate: Date | null
  eventType: string
  status: "active" | "completed"
}

interface EventFiltersProps {
  filters: EventFilters
  setFilters: (filters: EventFilters) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export default function EventFilters({
  filters,
  setFilters,
  onApplyFilters,
  onResetFilters,
}: EventFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, location: e.target.value })
  }

  const handleEventTypeChange = (value: string) => {
    setFilters({ ...filters, eventType: value })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setFilters({ ...filters, startDate: date || null })
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setFilters({ ...filters, endDate: date || null })
  }

  const hasActiveFilters = () => {
    return (
      filters.search !== "" ||
      filters.location !== "" ||
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.eventType !== "all"
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索活動..."
              className="pl-8"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* 地点搜索 */}
        <div className="flex-1">
          <div className="relative">
            <MapPinIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="活動地點..."
              className="pl-8"
              value={filters.location}
              onChange={handleLocationChange}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* 日期范围选择 */}
        <div className="flex-1">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  (filters.startDate || filters.endDate) &&
                    "text-primary border-primary/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate && filters.endDate
                  ? `${format(filters.startDate, "yyyy/MM/dd", { locale: zhTW })} - ${format(
                      filters.endDate,
                      "yyyy/MM/dd",
                      { locale: zhTW }
                    )}`
                  : filters.startDate
                  ? `${format(filters.startDate, "yyyy/MM/dd", { locale: zhTW })} 起`
                  : filters.endDate
                  ? `至 ${format(filters.endDate, "yyyy/MM/dd", { locale: zhTW })}`
                  : "選擇日期範圍"}
                {(filters.startDate || filters.endDate) && (
                  <X
                    className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilters({ ...filters, startDate: null, endDate: null })
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="space-y-1">
                  <Label htmlFor="start-date">開始日期</Label>
                  <Calendar
                    id="start-date"
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={handleStartDateChange}
                    disabled={(date) =>
                      filters.endDate ? date > filters.endDate : false
                    }
                    className="rounded-md border shadow"
                    locale={zhTW}
                  />
                </div>
                <div className="mt-4 space-y-1">
                  <Label htmlFor="end-date">結束日期</Label>
                  <Calendar
                    id="end-date"
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={handleEndDateChange}
                    disabled={(date) =>
                      filters.startDate ? date < filters.startDate : false
                    }
                    className="rounded-md border shadow"
                    locale={zhTW}
                  />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ ...filters, startDate: null, endDate: null })
                      setIsCalendarOpen(false)
                    }}
                  >
                    清除
                  </Button>
                  <Button onClick={() => setIsCalendarOpen(false)}>確定</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 活动类型选择 */}
        <div className="flex-1">
          <Select
            value={filters.eventType}
            onValueChange={handleEventTypeChange}
          >
            <SelectTrigger>
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="活動類型" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 筛选操作按钮 */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onResetFilters}
          disabled={!hasActiveFilters()}
        >
          重置篩選
        </Button>
        <Button onClick={onApplyFilters}>應用篩選</Button>
      </div>
    </div>
  )
} 