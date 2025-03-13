"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { toast } from "sonner"
import type { Database } from "@/lib/types/database.types"

type Report = Database['public']['Tables']['reports']['Row'] & {
  posts: {
    id: string
    caption: string
    media_url: string
    user_id: string
    profiles: {
      username: string
      avatar_url: string | null
    }
  } | null
  profiles: {
    username: string
    avatar_url: string | null
  } | null
}

interface ReportListProps {
  reports: Report[]
}

export function ReportList({ reports: initialReports }: ReportListProps) {
  const [reports, setReports] = useState(initialReports)
  const supabase = createClientComponentClient<Database>()

  const handleAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report || !report.posts) return

      if (action === 'approve') {
        // 刪除貼文
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', report.posts.id)

        if (deleteError) throw deleteError

        // 更新檢舉狀態
        await supabase
          .from('reports')
          .update({ status: 'approved', resolved_at: new Date().toISOString() })
          .eq('id', reportId)

        toast.success('已刪除違規貼文')
      } else {
        // 拒絕檢舉
        await supabase
          .from('reports')
          .update({ status: 'rejected', resolved_at: new Date().toISOString() })
          .eq('id', reportId)

        toast.success('已拒絕檢舉')
      }

      // 更新列表
      setReports(reports.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('處理檢舉時出錯:', error)
      toast.error('處理檢舉時發生錯誤')
    }
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        目前沒有待處理的檢舉
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={report.profiles?.avatar_url || '/placeholder.svg'} />
                <AvatarFallback>
                  {(report.profiles?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {report.profiles?.username || '未知用戶'} 檢舉了一則貼文
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(report.created_at), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-4 mb-2">
                <Avatar>
                  <AvatarImage src={report.posts?.profiles.avatar_url || '/placeholder.svg'} />
                  <AvatarFallback>
                    {(report.posts?.profiles.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {report.posts?.profiles.username || '未知用戶'}
                  </p>
                </div>
              </div>
              {report.posts?.media_url && (
                <div className="relative aspect-square rounded-md overflow-hidden mb-2">
                  <img
                    src={report.posts.media_url}
                    alt="Reported content"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <p className="text-sm">{report.posts?.caption}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">檢舉原因</p>
              <p className="text-sm">{report.reason}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction(report.id, 'reject')}
            >
              拒絕檢舉
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction(report.id, 'approve')}
            >
              刪除貼文
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
} 