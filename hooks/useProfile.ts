"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/profiles"

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchProfile()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchProfile()
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        setProfile(null)
        return
      }

      if (!user) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile error:', error)
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

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

      // 生成安全的文件名
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}_${Date.now()}.${fileExt}`

      // 上傳文件
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
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