import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { UserTable } from "../components/UserTable"
import type { Database } from "@/lib/types/database.types"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  posts: { count: number } | null
  reports: { count: number } | null
  role: 'admin' | 'user'
}

interface UserData {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  post_count: number
  report_count: number
  role: 'admin' | 'user'
}

async function getUsers() {
  const supabase = createServerComponentClient({ cookies })
  
  console.log('Fetching users...')
  const { data: users, error } = await supabase
    .rpc('get_users_with_post_counts')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // 添加調試日誌
  (users as UserData[])?.forEach(user => {
    console.log(`User ${user.username} has ${user.post_count || 0} posts`)
  })

  console.log('Users fetched:', users?.length || 0)
  return (users as UserData[])?.map(user => ({
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.created_at, // 使用 created_at 作為 updated_at
    bio: null,
    location: null,
    notification_preferences: null,
    posts: { count: user.post_count },
    reports: { count: user.report_count },
    role: user.role
  } as Profile)) || []
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