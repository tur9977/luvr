import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "../types/database.types"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// 導出預配置的 supabase 實例
export const supabase = createClientComponentClient<Database>()

export type { SupabaseClient } from '@supabase/supabase-js' 