"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/profiles"
import { processImageForAvatar } from "@/lib/utils/image"

// 緩存過期時間（10分鐘）
const CACHE_EXPIRY = 10 * 60 * 1000

interface CachedProfile {
  profile: Profile
  timestamp: number
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const initializedRef = useRef(false)

  const createProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: email,
            username: email.split('@')[0],
            full_name: '',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('創建個人資料時發生錯誤:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('createProfile 函數發生錯誤:', error)
      throw error
    }
  }

  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('userProfile')
      if (!cached) return null

      const { profile, timestamp }: CachedProfile = JSON.parse(cached)
      const now = Date.now()

      // 檢查緩存是否過期
      if (now - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem('userProfile')
        return null
      }

      return profile
    } catch (error) {
      console.error('讀取緩存個人資料時發生錯誤:', error)
      localStorage.removeItem('userProfile')
      return null
    }
  }

  const setCachedProfile = (profile: Profile) => {
    try {
      const cacheData: CachedProfile = {
        profile,
        timestamp: Date.now()
      }
      localStorage.setItem('userProfile', JSON.stringify(cacheData))
    } catch (error) {
      console.error('儲存緩存個人資料時發生錯誤:', error)
      localStorage.removeItem('userProfile')
    }
  }

  const fetchProfile = useCallback(async (force = false) => {
    try {
      setError(null)
      // 如果不是強制更新，先嘗試使用緩存
      if (!force) {
        const cachedProfile = getCachedProfile()
        if (cachedProfile) {
          setProfile(cachedProfile)
          setLoading(false)
          return
        }
      }

      // 先檢查認證會話
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('認證會話錯誤:', sessionError)
        setError(sessionError)
        setProfile(null)
        return
      }

      if (!session) {
        setProfile(null)
        return
      }

      const user = session.user
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('獲取個人資料時發生錯誤:', error)
        setError(error)
        setProfile(null)
        return
      }

      if (!data) {
        const newProfile = await createProfile(user.id, user.email || '')
        setProfile(newProfile)
        setCachedProfile(newProfile)
        return
      }

      setProfile(data)
      setCachedProfile(data)
    } catch (error) {
      console.error('獲取個人資料時發生錯誤:', error)
      setError(error as Error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      fetchProfile(false)
    }

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await fetchProfile(true)
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userProfile')
        setProfile(null)
        initializedRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setUpdating(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('未登入')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)

      if (error) throw error
      
      // 更新後強制刷新個人資料
      await fetchProfile(true)
    } catch (error) {
      console.error('更新個人資料時發生錯誤:', error)
      setError(error as Error)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUpdating(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error("未登入")

      const processedFile = await processImageForAvatar(file)
      const fileExt = 'jpg'
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        console.error("頭像上傳失敗:", uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (!publicUrl) {
        throw new Error("無法獲取頭像公開訪問地址")
      }

      const fullUrl = new URL(publicUrl).toString()
      await updateProfile({ avatar_url: fullUrl })
      toast.success("頭像已更新")
    } catch (error) {
      console.error("上傳頭像時發生錯誤:", error)
      setError(error as Error)
      toast.error("上傳頭像失敗")
      throw error
    } finally {
      setUpdating(false)
    }
  }

  return {
    profile,
    loading,
    updating,
    error,
    updateProfile,
    uploadAvatar,
  }
} 