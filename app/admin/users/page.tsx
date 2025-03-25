import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { UserTable } from "../components/UserTable"
import type { Profile } from "@/lib/types/profiles"
import { Database } from "@/lib/types/supabase"

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UserData extends Profile {
  post_count: number
  report_count: number
}

interface CountResult {
  user_id: string
  count: number
}

async function getUsers(): Promise<UserData[]> {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // 首先獲取所有用戶
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select(`
      *
    `)
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return []
  }

  // 然後獲取每個用戶的貼文數量
  const { data: postCounts, error: postsError } = await supabase
    .rpc('count_user_posts') as { data: CountResult[] | null, error: any }

  if (postsError) {
    console.error('Error fetching post counts:', postsError)
  }

  // 獲取每個用戶的檢舉數量
  const { data: reportCounts, error: reportsError } = await supabase
    .rpc('count_user_reports') as { data: CountResult[] | null, error: any }

  if (reportsError) {
    console.error('Error fetching report counts:', reportsError)
  }

  // 將數據組合在一起
  const userData = users.map(user => {
    const userPosts = postCounts?.find((p: CountResult) => p.user_id === user.id)
    const userReports = reportCounts?.find((r: CountResult) => r.user_id === user.id)
    
    return {
      ...user,
      post_count: userPosts?.count || 0,
      report_count: userReports?.count || 0
    }
  })

  console.log('Users data prepared:', userData.length)
  return userData
}

export default async function UsersPage() {
  console.log('Rendering UsersPage...')
  const users = await getUsers()
  console.log('Users loaded:', users.length)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">用戶管理</h2>
      </div>
      <UserTable users={users} />
    </div>
  )
} 