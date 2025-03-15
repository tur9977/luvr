"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Eye } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"

type Post = {
  id: string
  caption: string | null
  media_url: string | null
  created_at: string
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
  likes: { count: number }
  comments: { count: number }
  shares: { count: number }
  reports: { count: number }
}

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts: initialPosts }: PostListProps) {
  const [posts, setPosts] = useState(initialPosts)
  const supabase = createClientComponentClient()

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .rpc('admin_delete_post', {
          post_id: postId
        })

      if (error) throw error

      setPosts(posts.filter(post => post.id !== postId))
      toast.success('已刪除貼文')
    } catch (error) {
      console.error('刪除貼文時出錯:', error)
      toast.error('刪除貼文失敗')
    }
  }

  const handleView = (postId: string) => {
    window.open(`/p/${postId}`, '_blank')
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        目前沒有任何貼文
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>作者</TableHead>
            <TableHead>內容</TableHead>
            <TableHead>互動數</TableHead>
            <TableHead>檢舉數</TableHead>
            <TableHead>發布時間</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profiles.avatar_url || '/placeholder.svg'} />
                    <AvatarFallback>
                      {post.profiles.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium">
                    {post.profiles.username}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[300px] truncate">
                  {post.caption || '無文字內容'}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>讚：{post.likes?.count || 0}</div>
                  <div>留言：{post.comments?.count || 0}</div>
                  <div>分享：{post.shares?.count || 0}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className={post.reports?.count ? 'text-destructive font-medium' : ''}>
                  {post.reports?.count || 0}
                </span>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: zhTW
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">打開選單</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(post.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看貼文
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(post.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      刪除貼文
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 