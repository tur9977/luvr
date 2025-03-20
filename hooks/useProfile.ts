"use client"

import { useState, useEffect, useCallback } from "react"
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
        console.error('Error creating profile:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createProfile:', error)
      throw error
    }
  }

  const getCachedProfile = () => {
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
  }

  const setCachedProfile = (profile: Profile) => {
    const cacheData: CachedProfile = {
      profile,
      timestamp: Date.now()
    }
    localStorage.setItem('userProfile', JSON.stringify(cacheData))
  }

  const fetchProfile = useCallback(async (force = false) => {
    try {
      // 如果不是強制更新，先嘗試使用緩存
      if (!force) {
        const cachedProfile = getCachedProfile()
        if (cachedProfile) {
          console.log('Using cached profile')
          setProfile(cachedProfile)
          setLoading(false)
          return
        }
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        setProfile(null)
        return
      }

      if (!user) {
        console.log('No user found')
        setProfile(null)
        return
      }

      console.log('Fetching profile for user:', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profile error:', error)
        setProfile(null)
        return
      }

      if (!data) {
        console.log('No profile found for user, creating new profile')
        const newProfile = await createProfile(user.id, user.email || '')
        setProfile(newProfile)
        setCachedProfile(newProfile)
        return
      }

      console.log('Profile fetched successfully')
      setProfile(data)
      setCachedProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 初始加載時使用緩存
    fetchProfile(false)

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN') {
        // 登入時強制更新配置文件
        console.log('Fetching profile after sign in')
        await fetchProfile(true)
      } else if (event === 'SIGNED_OUT') {
        console.log('Clearing profile after sign out')
        localStorage.removeItem('userProfile')
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('No user')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      // 更新後強制刷新配置文件
      await fetchProfile(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("未登入")

      const processedFile = await processImageForAvatar(file)
      const fileExt = 'jpg'
      const fileName = `${user.id}_${Date.now()}.${fileExt}`

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
      console.error("Error uploading avatar:", error)
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
    updateProfile,
    uploadAvatar,
  }
} 