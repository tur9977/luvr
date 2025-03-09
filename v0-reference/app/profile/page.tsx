import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Heart, MapPin, MessageCircle, Users2 } from "lucide-react"
import Image from "next/image"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"

export default function ProfilePage() {
  return (
    <main className="container max-w-2xl mx-auto p-4 pt-8">
      {/* 個人資料卡片 */}
      <div className="flex flex-col items-center text-center mb-8">
        <Avatar className="w-32 h-32 border-4 border-background shadow-xl mb-4">
          <AvatarImage src="/placeholder.svg" alt="Profile picture" />
          <AvatarFallback className="text-4xl">JD</AvatarFallback>
        </Avatar>

        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold">Jane Doe</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">台北市</span>
          </div>
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

        <p className="text-muted-foreground max-w-md mb-4">
          熱愛生活，熱愛分享。喜歡攝影、旅行和美食。讓我們一起創造美好的回憶！ #LGBT #Photography #Travel
        </p>

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

