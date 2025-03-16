import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ReportList } from "@/app/admin/components/ReportList"
import type { Report } from "@/lib/types/profiles"

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BaseReport {
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
}

interface PostDetails {
  id: string
  caption: string | null
  media_url: string
  user_id: string
  profiles: Array<{
    username: string
    avatar_url: string | null
  }>
}

interface ReporterDetails {
  username: string
  avatar_url: string | null
}

async function getReports(): Promise<Report[]> {
  const supabase = createServerComponentClient({ cookies })
  
  console.log('Fetching reports...')
  
  // 首先獲取檢舉記錄
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(`
      id,
      reporter_id,
      reported_content_id,
      reported_user_id,
      reason,
      status,
      admin_note,
      created_at,
      resolved_at,
      resolved_by
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (reportsError) {
    console.error('Error fetching reports:', reportsError.message)
    return []
  }

  if (!reports || reports.length === 0) {
    console.log('No pending reports found')
    return []
  }

  // 然後獲取相關的貼文和用戶資料
  const reportsWithDetails = await Promise.all(
    (reports as BaseReport[]).map(async (report) => {
      try {
        // 獲取貼文資料
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            id,
            caption,
            media_url,
            user_id,
            profiles:profiles(
              username,
              avatar_url
            )
          `)
          .eq('id', report.reported_content_id)
          .single()
        
        if (postError) {
          console.error(`Error fetching post ${report.reported_content_id}:`, postError.message)
        }
        
        // 獲取檢舉者資料
        const { data: reporterData, error: reporterError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', report.reporter_id)
          .single()
          
        if (reporterError) {
          console.error(`Error fetching reporter ${report.reporter_id}:`, reporterError.message)
        }

        // 构建与Report类型匹配的对象
        const formattedReport: Report = {
          ...report,
          posts: postData ? {
            id: postData.id,
            caption: postData.caption,
            media_url: postData.media_url,
            user_id: postData.user_id,
            profiles: postData.profiles[0] || {
              username: '未知用戶',
              avatar_url: null
            }
          } : null,
          reporter: reporterData || null
        }
        
        return formattedReport
      } catch (error) {
        console.error(`Error processing report ${report.id}:`, error)
        // 返回基本报告，但posts和reporter为null
        return {
          ...report,
          posts: null,
          reporter: null
        } as Report
      }
    })
  )

  console.log('Reports with details:', reportsWithDetails.length)
  return reportsWithDetails
}

export default async function ReportsPage() {
  console.log('Rendering ReportsPage...')
  const reports = await getReports()
  console.log('Reports loaded:', reports.length)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">檢舉管理</h2>
      </div>
      <ReportList reports={reports} />
    </div>
  )
} 