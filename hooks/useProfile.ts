"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/profiles"
import { processImageForAvatar } from "@/lib/utils/image"

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
            username: email.split('@')[0], // 使用郵箱前綴作為默認用戶名
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

      console.log('Profile created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createProfile:', error)
      throw error
    }
  }

  const fetchProfile = useCallback(async () => {
    try {
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
        // 如果沒有找到個人資料，創建一個新的
        const newProfile = await createProfile(user.id, user.email || '')
        setProfile(newProfile)
        return
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 初始加載
    fetchProfile()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('Fetching profile after sign in')
        await fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        console.log('Clearing profile after sign out')
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
      
      await fetchProfile()
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

      // 處理圖片
      const processedFile = await processImageForAvatar(file)

      // 生成安全的文件名
      const fileExt = 'jpg' // 統一使用 jpg 格式
      const fileName = `${user.id}_${Date.now()}.${fileExt}`

      // 上傳文件
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        console.error("頭像上傳失敗:", {
          error: uploadError,
          message: uploadError.message
        })
        throw uploadError
      }

      // 獲取公開URL並確保它是完整的URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (!publicUrl) {
        throw new Error("無法獲取頭像公開訪問地址")
      }

      // 確保URL是完整的
      const fullUrl = new URL(publicUrl).toString()
      console.log("獲取到公開URL:", fullUrl)

      // 更新個人資料
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