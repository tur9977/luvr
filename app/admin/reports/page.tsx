import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ReportList } from "../components/ReportList"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getReports() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      posts (
        id,
        caption,
        media_url,
        user_id,
        profiles (
          username,
          avatar_url
        )
      ),
      profiles!reporter_id (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  return reports || []
}

export default async function ReportsPage() {
  const reports = await getReports()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">檢舉管理</h2>
      </div>
      <ReportList reports={reports} />
    </div>
  )
} 