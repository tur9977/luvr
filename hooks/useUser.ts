"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types/database.types"

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    // 獲取當前用戶
    const getUser = async () => {
      try {
        // 先檢查會話
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (!session) {
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session.user)
        }

        if (session.user) {
          // 獲取用戶資料
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profileError) throw profileError
          
          if (mounted) {
            setProfile(profile)
          }
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error)
        if (mounted) {
          setError(error instanceof Error ? error : new Error("Unknown error"))
          // 清除可能不完整的數據
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setError(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (profileError) throw profileError
            if (mounted) {
              setProfile(profile)
            }
          } catch (error) {
            console.error("獲取用戶資料失敗:", error)
            if (mounted) {
              setError(error instanceof Error ? error : new Error("Unknown error"))
            }
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, error }
} 