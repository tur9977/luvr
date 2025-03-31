'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Report = {
  id: string
  created_at: string
  report_type: string
  details: string
  status: 'pending' | 'investigating' | 'resolved' | 'rejected'
  reporter_id: string
  reported_content_id: string
  reporter: {
    username: string
  }
  reported_content: {
    id: string
    content_type: string
  }
}

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const { checkPermission, hasAnyPermission } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 檢查權限
    if (!hasAnyPermission(['read:reports', 'write:reports'])) {
      toast.error('您沒有權限訪問此頁面')
      router.push('/')
      return
    }

    fetchReports()
  }, [hasAnyPermission, router])

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(username),
          reported_content:posts!reports_reported_content_id_fkey(id, content_type)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('載入檢舉失敗')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(reportId: string, action: string) {
    // 檢查權限
    if (!checkPermission('write:reports')) {
      toast.error('您沒有權限執行此操作')
      return
    }

    try {
      const { error } = await supabase
        .from('report_actions')
        .insert({
          report_id: reportId,
          action_type: action,
          admin_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error
      
      toast.success('處理成功')
      fetchReports() // 重新載入列表
    } catch (error) {
      console.error('Error handling report:', error)
      toast.error('處理失敗')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              檢舉類型: {report.report_type}
            </CardTitle>
            <Badge variant={
              report.status === 'pending' ? 'secondary' :
              report.status === 'investigating' ? 'default' :
              report.status === 'resolved' ? 'default' :
              'destructive'
            }>
              {report.status === 'pending' ? '待處理' :
               report.status === 'investigating' ? '調查中' :
               report.status === 'resolved' ? '已解決' :
               '已拒絕'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <p>檢舉者: {report.reporter.username}</p>
              <p>檢舉時間: {new Date(report.created_at).toLocaleString()}</p>
            </div>
            <p className="text-sm">{report.details}</p>
            
            {report.status === 'pending' && checkPermission('write:reports') && (
              <div className="mt-4">
                <Button
                  onClick={() => handleAction(report.id, 'investigate')}
                  variant="default"
                >
                  開始調查
                </Button>
              </div>
            )}
            
            {report.status === 'investigating' && checkPermission('write:reports') && (
              <div className="mt-4 space-x-2">
                <Button
                  onClick={() => handleAction(report.id, 'warn')}
                  variant="secondary"
                >
                  警告用戶
                </Button>
                <Button
                  onClick={() => handleAction(report.id, 'ban')}
                  variant="destructive"
                >
                  封禁用戶
                </Button>
                <Button
                  onClick={() => handleAction(report.id, 'delete')}
                  variant="destructive"
                >
                  刪除內容
                </Button>
                <Button
                  onClick={() => handleAction(report.id, 'reject')}
                  variant="secondary"
                >
                  拒絕處理
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {reports.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          目前沒有檢舉
        </div>
      )}
    </div>
  )
} 