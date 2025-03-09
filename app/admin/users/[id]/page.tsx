"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Shield, Ban, UserX } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Profile, Post, Comment, AdminRole } from "@/lib/types/database.types"

interface ExtendedProfile extends Profile {
  is_banned?: boolean
  admin_role?: AdminRole
  posts_count?: number
  comments_count?: number
  ban_history?: {
    reason: string
    start_at: string
    end_at: string | null
    admin_name?: string
  }[]
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<ExtendedProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole | null>(null)

  useEffect(() => {
    fetchUserDetails()
    fetchCurrentAdminRole()
  }, [params.id])

  const fetchCurrentAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setCurrentAdminRole(data.role as AdminRole)
      }
    }
  }

  const fetchUserDetails = async () => {
    try {
      // 獲取用戶基本信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (profile) {
        // 獲取封禁狀態
        const { data: bans } = await supabase
          .from('user_bans')
          .select('*')
          .eq('user_id', params.id)
          .order('created_at', { ascending: false })

        // 獲取管理員角色
        const { data: adminRole } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', params.id)
          .single()

        // 獲取貼文數量
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', params.id)

        // 獲取評論數量
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', params.id)

        // 獲取最近的貼文
        const { data: recentPosts } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', params.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // 獲取最近的評論
        const { data: recentComments } = await supabase
          .from('comments')
          .select('*, posts(*)')
          .eq('user_id', params.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setUser({
          ...profile,
          is_banned: bans?.some(ban => new Date(ban.expires_at) > new Date()),
          admin_role: adminRole?.role,
          posts_count: postsCount || 0,
          comments_count: commentsCount || 0,
          ban_history: bans?.map(ban => ({
            reason: ban.reason,
            start_at: ban.start_at,
            end_at: ban.expires_at,
          })),
        })

        if (recentPosts) setPosts(recentPosts)
        if (recentComments) setComments(recentComments)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const handleBanUser = async () => {
    if (!user) return

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (user.is_banned) {
        // 解除封禁
        await supabase
          .from('user_bans')
          .delete()
          .eq('user_id', user.id)
          .gt('expires_at', new Date().toISOString())
      } else {
        // 封禁用戶
        await supabase.from('user_bans').insert({
          user_id: user.id,
          admin_id: currentUser?.id,
          reason: '違反社群規範',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天
        })
      }

      await fetchUserDetails()
    } catch (error) {
      console.error('Error managing user ban:', error)
    } finally {
      setShowBanDialog(false)
    }
  }

  const handleRoleChange = async () => {
    if (!user || !selectedRole) return

    try {
      if (user.admin_role) {
        // 如果已經有角色，更新它
        await supabase
          .from('admin_roles')
          .update({ role: selectedRole })
          .eq('user_id', user.id)
      } else {
        // 如果沒有角色，創建新的
        await supabase.from('admin_roles').insert({
          user_id: user.id,
          role: selectedRole,
        })
      }

      await fetchUserDetails()
    } catch (error) {
      console.error('Error updating user role:', error)
    } finally {
      setShowRoleDialog(false)
      setSelectedRole(null)
    }
  }

  const canManageUser = () => {
    if (!currentAdminRole || !user) return false
    if (currentAdminRole === 'super_admin') return true
    if (currentAdminRole === 'admin' && user.admin_role !== 'super_admin') return true
    return false
  }

  if (!user) return null

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 用戶基本信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>用戶信息</CardTitle>
                <CardDescription>用戶的基本資料</CardDescription>
              </div>
              {user.admin_role && (
                <div className="flex items-center gap-1 text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="capitalize">{user.admin_role}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden">
                <Image
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.username || ''}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">{user.full_name}</h3>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.location && (
                  <p className="text-sm text-muted-foreground">{user.location}</p>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <p>
                <span className="font-medium">註冊時間：</span>
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">貼文數量：</span>
                {user.posts_count}
              </p>
              <p>
                <span className="font-medium">評論數量：</span>
                {user.comments_count}
              </p>
              <p>
                <span className="font-medium">帳號狀態：</span>
                {user.is_banned ? (
                  <span className="text-destructive font-medium">已封禁</span>
                ) : (
                  <span className="text-green-600 font-medium">正常</span>
                )}
              </p>
            </div>

            {canManageUser() && (
              <div className="pt-4 flex gap-2">
                <Button
                  variant={user.is_banned ? "outline" : "destructive"}
                  onClick={() => setShowBanDialog(true)}
                >
                  {user.is_banned ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      解除封禁
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      封禁用戶
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRole(user.admin_role || 'moderator')
                    setShowRoleDialog(true)
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {user.admin_role ? "修改權限" : "設置權限"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 用戶活動 */}
        <Card>
          <CardHeader>
            <CardTitle>用戶活動</CardTitle>
            <CardDescription>用戶的最近活動記錄</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="posts">
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1">最近貼文</TabsTrigger>
                <TabsTrigger value="comments" className="flex-1">最近評論</TabsTrigger>
                {user.ban_history && user.ban_history.length > 0 && (
                  <TabsTrigger value="bans" className="flex-1">封禁記錄</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="posts" className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="border-b pb-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                      <p className="line-clamp-2">{post.caption}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">暫無貼文</p>
                )}
              </TabsContent>
              <TabsContent value="comments" className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                      <p className="line-clamp-2">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">暫無評論</p>
                )}
              </TabsContent>
              {user.ban_history && user.ban_history.length > 0 && (
                <TabsContent value="bans" className="space-y-4">
                  {user.ban_history.map((ban, index) => (
                    <div key={index} className="border-b pb-4">
                      <p className="font-medium">{ban.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        開始時間：{new Date(ban.start_at).toLocaleString()}
                      </p>
                      {ban.end_at && (
                        <p className="text-sm text-muted-foreground">
                          結束時間：{new Date(ban.end_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 封禁確認對話框 */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.is_banned ? "解除用戶封禁" : "封禁用戶"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_banned
                ? "確定要解除此用戶的封禁狀態嗎？解除後用戶將可以正常使用系統。"
                : "確定要封禁此用戶嗎？封禁後用戶將無法登入系統。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className={user.is_banned ? "" : "bg-destructive"}
            >
              {user.is_banned ? "解除封禁" : "確認封禁"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 權限設置對話框 */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>設置用戶權限</AlertDialogTitle>
            <AlertDialogDescription>
              選擇要賦予用戶的權限等級
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedRole || undefined}
              onValueChange={(value) => setSelectedRole(value as AdminRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇權限等級" />
              </SelectTrigger>
              <SelectContent>
                {currentAdminRole === 'super_admin' && (
                  <SelectItem value="super_admin">超級管理員</SelectItem>
                )}
                <SelectItem value="admin">管理員</SelectItem>
                <SelectItem value="moderator">版主</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 