import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { UserTable } from "../components/UserTable"

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  users?.forEach(user => {
    console.log(`User ${user.username} has ${user.post_count || 0} posts`)
  })

  console.log('Users fetched:', users?.length || 0)
  return users.map(user => ({
    ...user,
    posts: { count: user.post_count }
  })) || []
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