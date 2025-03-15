"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Users, FileText } from "lucide-react"

type Stats = {
  usersCount: number
  postsCount: number
  reportsCount: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    usersCount: 0,
    postsCount: 0,
    reportsCount: 0
  })
  
  const supabase = createClientComponentClient()

  const fetchStats = async () => {
    const [
      { count: usersCount },
      { count: postsCount },
      { count: pendingReportsCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
    ])

    setStats({
      usersCount: usersCount || 0,
      postsCount: postsCount || 0,
      reportsCount: pendingReportsCount || 0
    })
  }

  useEffect(() => {
    // 初始載入
    fetchStats()

    // 訂閱 reports 表的變更
    const reportsChannel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          // 當 reports 表有任何變更時更新統計
          fetchStats()
        }
      )
      .subscribe()

    // 訂閱 posts 表的變更
    const postsChannel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          // 當 posts 表有任何變更時更新統計
          fetchStats()
        }
      )
      .subscribe()

    // 清理函數
    return () => {
      reportsChannel.unsubscribe()
      postsChannel.unsubscribe()
    }
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總用戶數</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.usersCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總貼文數</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.postsCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待處理檢舉</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reportsCount}</div>
        </CardContent>
      </Card>
    </div>
  )
} 