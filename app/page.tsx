import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Heart, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container max-w-2xl mx-auto p-4">
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">動態消息</TabsTrigger>
          <TabsTrigger value="events">活動</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="space-y-4 mt-4">
          {/* Post Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link href="/profile" className="text-sm font-semibold hover:underline">
                  Jane Doe
                </Link>
                <p className="text-xs text-muted-foreground">2小時前</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Image
                src="/placeholder.svg"
                alt="Post image"
                width={600}
                height={400}
                className="w-full object-cover aspect-square"
              />
              <div className="p-4">
                <p className="text-sm">今天的彩虹很美 🌈 #LGBTQLove #Pride</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-2">
              <div className="flex gap-4">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link href="/profile" className="text-sm font-semibold hover:underline">
                  Alice Smith
                </Link>
                <p className="text-xs text-muted-foreground">5小時前</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Image
                src="/placeholder.svg"
                alt="Post image"
                width={600}
                height={400}
                className="w-full object-cover aspect-square"
              />
              <div className="p-4">
                <p className="text-sm">美好的週末時光 ☀️ #Weekend #Friends</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-2">
              <div className="flex gap-4">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4 mt-4">
          {/* Event Card */}
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <Image
                  src="/placeholder.svg"
                  alt="Event cover"
                  width={600}
                  height={200}
                  className="w-full object-cover h-48"
                />
                <div className="absolute top-4 left-4 bg-background/90 rounded-lg p-2 backdrop-blur">
                  <p className="text-sm font-semibold">台北同志遊行</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    2024年10月28日
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm">一年一度的台北同志遊行即將展開！讓我們一起為平等與愛發聲。</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">我要參加</Button>
                  <Button variant="outline" size="sm">
                    了解更多
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <Image
                  src="/placeholder.svg"
                  alt="Event cover"
                  width={600}
                  height={200}
                  className="w-full object-cover h-48"
                />
                <div className="absolute top-4 left-4 bg-background/90 rounded-lg p-2 backdrop-blur">
                  <p className="text-sm font-semibold">女同志電影放映會</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    2024年9月15日
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm">一起來欣賞獲獎女同志電影，映後將有導演座談會。</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">我要參加</Button>
                  <Button variant="outline" size="sm">
                    了解更多
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

