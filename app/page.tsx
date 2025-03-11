import { cookies } from "next/headers"
import type { Database } from "@/lib/types/database.types"
import { HomeTabs } from "./components/HomeTabs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select()
    .eq('id', user?.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(*),
      likes(*),
      comments(*),
      shares(*)
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-3xl">
        <HomeTabs posts={posts || []} currentUser={currentProfile} />
      </div>
    </main>
  )
}

