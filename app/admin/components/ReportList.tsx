"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { toast } from "sonner"

type Report = {
  id: string
  reporter_id: string
  reported_content_id: string
  reported_user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  posts: {
    id: string
    caption: string | null
    media_url: string | null
    user_id: string
    profiles: {
      username: string
      avatar_url: string | null
    }
  } | null
  reporter: {
    username: string
    avatar_url: string | null
  } | null
}

interface ReportListProps {
  reports: Report[]
}

export function ReportList({ reports: initialReports }: ReportListProps) {
  const [reports, setReports] = useState(initialReports)
  const supabase = createClientComponentClient()

  const handleAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .rpc('admin_handle_report', {
          report_id: reportId,
          action: action
        })

      if (error) throw error

      setReports(reports.filter(r => r.id !== reportId))
      toast.success(action === 'approve' ? '已刪除違規貼文' : '已拒絕檢舉')
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
                <AvatarImage src={report.reporter?.avatar_url || '/placeholder.svg'} />
                <AvatarFallback>
                  {(report.reporter?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {report.reporter?.username || '未知用戶'} 檢舉了一則貼文
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
                    alt="被檢舉的內容"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <p className="text-sm">{report.posts?.caption || '無文字內容'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">檢舉原因</p>
              <p className="text-sm whitespace-pre-wrap break-words">{report.reason}</p>
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