"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

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

export function ReportList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReports()
  }, [])

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
    return <div>載入中...</div>
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">
                檢舉類型: {report.report_type}
              </h3>
              <p className="text-sm text-gray-600">
                檢舉者: {report.reporter.username}
              </p>
              <p className="text-sm text-gray-600">
                檢舉時間: {new Date(report.created_at).toLocaleString()}
              </p>
              <p className="mt-2">{report.details}</p>
            </div>
            <div className="text-sm">
              <span className={`px-2 py-1 rounded ${
                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                report.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {report.status === 'pending' ? '待處理' :
                 report.status === 'investigating' ? '調查中' :
                 report.status === 'resolved' ? '已解決' :
                 '已拒絕'}
              </span>
            </div>
          </div>
          
          {report.status === 'pending' && (
            <div className="mt-4 space-x-2">
              <button
                onClick={() => handleAction(report.id, 'investigate')}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                開始調查
              </button>
            </div>
          )}
          
          {report.status === 'investigating' && (
            <div className="mt-4 space-x-2">
              <button
                onClick={() => handleAction(report.id, 'warn')}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                警告用戶
              </button>
              <button
                onClick={() => handleAction(report.id, 'ban')}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                封禁用戶
              </button>
              <button
                onClick={() => handleAction(report.id, 'delete')}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                刪除內容
              </button>
              <button
                onClick={() => handleAction(report.id, 'reject')}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                拒絕處理
              </button>
            </div>
          )}
        </div>
      ))}
      
      {reports.length === 0 && (
        <div className="text-center text-gray-500">
          目前沒有檢舉
        </div>
      )}
    </div>
  )
} 