"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Heart, Loader2, MapPin, MessageCircle, Users2 } from "lucide-react"
import Image from "next/image"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"
import { useProfile } from "@/hooks/useProfile"

export default function ProfilePage() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold">未找到個人資料</h1>
        <p className="text-muted-foreground">請先登入或建立帳號</p>
      </div>
    )
  }

  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      {/* 個人資料卡片 */}
      <div className="flex flex-col items-center text-center mb-8">
        <Avatar className="w-32 h-32 border-4 border-background shadow-xl mb-4">
          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt="Profile picture" />
          <AvatarFallback className="text-4xl">{profile.full_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
        </Avatar>

        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold">{profile.full_name || profile.username || "未設定名稱"}</h1>
          {profile.location && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{profile.location}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-8 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Users2 className="h-4 w-4 text-[#8A6FD4]" />
            <span>142 位追蹤者</span>
          </div>
          <div className="flex items-center gap-1">
            <Users2 className="h-4 w-4 text-[#8A6FD4]" />
            <span>追蹤 89 人</span>
          </div>
        </div>

        {profile.bio && (
          <p className="text-muted-foreground max-w-md mb-4">{profile.bio}</p>
        )}

        <ProfileEditDialog />
      </div>

      {/* 內容分頁 */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">貼文</TabsTrigger>
          <TabsTrigger value="events">活動</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Post Cards */}
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="overflow-hidden group cursor-pointer">
                <div className="relative aspect-square">
                  <Image
                    src="/placeholder.svg"
                    alt="Post image"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Heart className="h-5 w-5" />
                      <span>24</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-5 w-5" />
                      <span>12</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4 mt-6">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="relative h-48 w-full">
                <Image src="/placeholder.svg" alt="Event cover" fill className="object-cover rounded-md" />
              </div>
              <div>
                <h3 className="font-semibold">彩虹野餐日</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-sm">2024年9月15日</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  一起來大安森林公園野餐吧！帶上你的野餐墊和美食，讓我們共度愉快的週末午後。
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#8A6FD4] hover:bg-[#7857C8]">
                  我要參加
                </Button>
                <Button variant="outline" size="sm">
                  了解更多
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

