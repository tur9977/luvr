"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database.types"

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

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
        throw error
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
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

      // 生成唯一的文件名
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 上傳文件
      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 獲取公開URL
      const { data: { publicUrl } } = supabase.storage
        .from("public")
        .getPublicUrl(filePath)

      // 更新個人資料
      await updateProfile({ avatar_url: publicUrl })
      toast.success("頭像已更新")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("上傳頭像失敗")
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