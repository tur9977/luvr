"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ImageIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

export default function CreatePage() {
  const [date, setDate] = useState<Date>()
  const [isUploading, setIsUploading] = useState(false)

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      <Tabs defaultValue="post" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="post">發布貼文</TabsTrigger>
          <TabsTrigger value="event">建立活動</TabsTrigger>
        </TabsList>

        <TabsContent value="post">
          <Card>
            <CardHeader>
              <CardTitle>新貼文</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>上傳圖片</Label>
                <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm text-muted-foreground">上傳中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">點擊或拖曳圖片至此處</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">內容</Label>
                <Textarea id="content" placeholder="分享你的想法..." className="min-h-[100px]" />
              </div>
              <Button className="w-full">發布</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event">
          <Card>
            <CardHeader>
              <CardTitle>建立活動</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">活動名稱</Label>
                <Input id="event-title" placeholder="輸入活動名稱" />
              </div>
              <div className="space-y-2">
                <Label>活動日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: zhTW }) : "選擇日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>活動封面</Label>
                <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm text-muted-foreground">上傳中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">點擊或拖曳圖片至此處</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">活動說明</Label>
                <Textarea id="event-description" placeholder="描述活動內容..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">活動地點</Label>
                <Input id="event-location" placeholder="輸入活動地點" />
              </div>
              <Button className="w-full">建立活動</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

