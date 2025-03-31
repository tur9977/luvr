import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types/database.types"
import { toast } from "sonner"
import { Permission, Role, ROLE_PERMISSIONS } from "@/lib/constants/permissions"

// 緩存過期時間（10分鐘）
const CACHE_EXPIRY = 10 * 60 * 1000

interface CachedData {
  user: User | null
  profile: Profile | null
  role: Role
  isAdmin: boolean
  isBanned: boolean
  permissions: Permission[]
  timestamp: number
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  role: Role
  isAdmin: boolean
  isBanned: boolean
  permissions: Permission[]
  loading: boolean
  error: Error | null
}

export function useAuth(): AuthState & {
  checkPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  refreshAuth: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: 'user',
    isAdmin: false,
    isBanned: false,
    permissions: [],
    loading: true,
    error: null
  })

  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem('authData')
      if (!cached) return null

      const data: CachedData = JSON.parse(cached)
      const now = Date.now()

      // 檢查緩存是否過期
      if (now - data.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem('authData')
        return null
      }

      return data
    } catch (error) {
      console.error('讀取認證緩存時發生錯誤:', error)
      localStorage.removeItem('authData')
      return null
    }
  }

  const setCachedData = (data: Omit<CachedData, 'timestamp'>) => {
    try {
      const cacheData: CachedData = {
        ...data,
        timestamp: Date.now()
      }
      localStorage.setItem('authData', JSON.stringify(cacheData))
    } catch (error) {
      console.error('儲存認證緩存時發生錯誤:', error)
      localStorage.removeItem('authData')
    }
  }

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

  const refreshAuth = useCallback(async (force = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // 獲取認證會話
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      // 如果沒有會話，清除所有狀態
      if (!session) {
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
          role: 'user',
          isAdmin: false,
          isBanned: false,
          permissions: [],
          loading: false
        }))
        localStorage.removeItem('authData')
        return
      }

      // 如果不是強制更新，先嘗試使用緩存
      if (!force) {
        const cachedData = getCachedData()
        if (cachedData && cachedData.user?.id === session.user.id) {
          console.log('使用緩存的認證數據')
          setState(prev => ({
            ...prev,
            ...cachedData,
            loading: false
          }))
          return
        }
      }

      // 獲取用戶資料
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle()

      if (profileError) throw profileError

      let finalProfile = profile
      if (!finalProfile) {
        console.log('未找到個人資料，正在創建新資料')
        finalProfile = await createProfile(session.user.id, session.user.email || '')
      }

      // 檢查是否被封禁
      const { data: bans } = await supabase
        .from("user_bans")
        .select("*")
        .eq("user_id", session.user.id)
        .gt("expires_at", new Date().toISOString())
        .limit(1)

      const isBanned = Boolean(bans?.length)
      const role = (finalProfile.role as Role) || 'user'
      const isAdmin = role === 'admin'
      const permissions = ROLE_PERMISSIONS[role]

      const newState = {
        user: session.user,
        profile: finalProfile,
        role,
        isAdmin,
        isBanned,
        permissions,
        loading: false,
        error: null
      }

      setState(newState)
      setCachedData(newState)
    } catch (error) {
      console.error("Auth refresh error:", error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error("Unknown error"),
        loading: false
      }))
      localStorage.removeItem('authData')
    }
  }, [])

  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!state.permissions) return false
    if (state.loading || state.error || state.isBanned) return false
    return state.permissions.includes(permission)
  }, [state.permissions, state.loading, state.error, state.isBanned])

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!state.permissions) return false
    if (state.loading || state.error || state.isBanned) return false
    return permissions.some(permission => state.permissions.includes(permission))
  }, [state.permissions, state.loading, state.error, state.isBanned])

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!state.permissions) return false
    if (state.loading || state.error || state.isBanned) return false
    return permissions.every(permission => state.permissions.includes(permission))
  }, [state.permissions, state.loading, state.error, state.isBanned])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      if (!state.user?.id) throw new Error('未登入')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) throw error

      setState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...data } as Profile
      }))

      // 更新緩存
      const cachedData = getCachedData()
      if (cachedData) {
        setCachedData({
          ...cachedData,
          profile: { ...cachedData.profile, ...data } as Profile
        })
      }
    } catch (error) {
      console.error('更新個人資料時發生錯誤:', error)
      throw error
    }
  }, [state.user?.id])

  const uploadAvatar = useCallback(async (file: File) => {
    try {
      if (!state.user?.id) throw new Error('未登入')

      const fileExt = file.name.split('.').pop()
      const filePath = `${state.user.id}/avatar.${fileExt}`

      // 上傳頭像
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 更新個人資料
      await updateProfile({ avatar_url: publicUrl })
    } catch (error) {
      console.error('上傳頭像時發生錯誤:', error)
      throw error
    }
  }, [state.user?.id, updateProfile])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      // 強制刷新認證狀態
      await refreshAuth(true)
      
      if (event === 'SIGNED_OUT') {
        // 清除所有狀態和緩存
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
          role: 'user',
          isAdmin: false,
          isBanned: false,
          permissions: [],
          loading: false
        }))
        localStorage.removeItem('authData')
      }
    })

    // 初始化時檢查認證狀態
    refreshAuth(true)

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshAuth])

  return {
    ...state,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshAuth,
    updateProfile,
    uploadAvatar
  }
} 