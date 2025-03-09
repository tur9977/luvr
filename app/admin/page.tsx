"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Flag, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  pendingReports: number
  bannedUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    pendingReports: 0,
    bannedUsers: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 獲取用戶總數
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // 獲取貼文總數
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })

        // 獲取待處理舉報數
        const { count: reportsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // 獲取被封禁用戶數
        const { count: bannedCount } = await supabase
          .from('user_bans')
          .select('*', { count: 'exact', head: true })
          .gt('expires_at', new Date().toISOString())

        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          pendingReports: reportsCount || 0,
          bannedUsers: bannedCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">儀表板</h1>
        <p className="text-muted-foreground">歡迎回來，管理員</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總用戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總貼文數</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待處理舉報</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">被封禁用戶</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bannedUsers}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 