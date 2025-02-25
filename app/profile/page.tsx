import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Heart, Link2, MapPin, MessageCircle, Share2, Users2 } from "lucide-react"
import Image from "next/image"
import { ProfileEditDialog } from "@/components/profile-edit-dialog"

export default function ProfilePage() {
  return (
    <main className="container max-w-2xl mx-auto pb-8">
      {/* 封面圖片 */}
      <div className="relative h-48 md:h-64 w-full">
        <Image src="/placeholder.svg" alt="Cover image" fill className="object-cover" />
      </div>

      {/* 個人資料卡片 */}
      <div className="px-4">
        <div className="relative -mt-20 mb-4">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src="/placeholder.svg" alt="Profile picture" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Jane Doe</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">台北市</span>
            </div>
          </div>
          <ProfileEditDialog />
        </div>

        <div className="flex gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1">
            <Users2 className="h-4 w-4" />
            <span>142 位追蹤者</span>
          </div>
          <div className="flex items-center gap-1">
            <Link2 className="h-4 w-4" />
            <span>追蹤 89 人</span>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          熱愛生活，熱愛分享。喜歡攝影、旅行和美食。讓我們一起創造美好的回憶！ #LGBT #Photography #Travel
        </p>

        {/* 內容分頁 */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">貼文</TabsTrigger>
            <TabsTrigger value="events">活動</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="relative aspect-square w-full">
                  <Image src="/placeholder.svg" alt="Post image" fill className="object-cover rounded-md" />
                </div>
                <p className="text-sm">美好的一天從早晨的陽光開始 ☀️ #Morning #Positive</p>
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs">2小時前</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-4">
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
                  <Button size="sm">我要參加</Button>
                  <Button variant="outline" size="sm">
                    了解更多
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

