import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database.types'

export const createClient = () => createClientComponentClient<Database>()

export const supabase = createClient()
export type { SupabaseClient } from '@supabase/auth-helpers-nextjs' 