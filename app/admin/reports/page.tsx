import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ReportList } from "@/app/admin/components/ReportList"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getReports() {
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
    reports.map(async (report) => {
      const [postResult, reporterResult] = await Promise.all([
        // 獲取貼文資料
        supabase
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
          .single(),
        
        // 獲取檢舉者資料
        supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', report.reporter_id)
          .single()
      ])

      return {
        ...report,
        posts: postResult.data,
        reporter: reporterResult.data
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