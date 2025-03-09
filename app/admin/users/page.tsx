"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MoreHorizontal, Search, Shield, Ban, UserX } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Profile, AdminRole } from "@/lib/types/database.types"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface ExtendedProfile extends Profile {
  is_banned?: boolean
  admin_role?: AdminRole
}

export default function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<ExtendedProfile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole | null>(null)

  useEffect(() => {
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

    fetchCurrentAdminRole()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [searchQuery])

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }

      const { data: profiles } = await query

      if (profiles) {
        // 獲取用戶封禁狀態
        const { data: bans } = await supabase
          .from('user_bans')
          .select('user_id')
          .gt('expires_at', new Date().toISOString())

        // 獲取管理員角色
        const { data: adminRoles } = await supabase
          .from('admin_roles')
          .select('user_id, role')

        const bannedUserIds = new Set(bans?.map(ban => ban.user_id) || [])
        const adminRolesMap = new Map(adminRoles?.map(role => [role.user_id, role.role]) || [])

        const extendedProfiles = profiles.map(profile => ({
          ...profile,
          is_banned: bannedUserIds.has(profile.id),
          admin_role: adminRolesMap.get(profile.id),
        }))

        setUsers(extendedProfiles)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "加載用戶列表失敗",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (user: ExtendedProfile) => {
    router.push(`/admin/users/${user.id}`)
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      // 檢查是否已經被封禁
      if (selectedUser.is_banned) {
        // 解除封禁：刪除所有未過期的封禁記錄
        await supabase
          .from('user_bans')
          .delete()
          .eq('user_id', selectedUser.id)
          .gt('expires_at', new Date().toISOString())
      } else {
        // 封禁用戶：創建新的封禁記錄
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('user_bans').insert({
          user_id: selectedUser.id,
          admin_id: user?.id,
          reason: '違反社群規範',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天
        })
      }

      // 重新獲取用戶列表
      await fetchUsers()
      toast({
        title: "成功",
        description: `已${selectedUser.is_banned ? '解除封禁' : '封禁'}用戶`,
      })
    } catch (error) {
      console.error('Error managing user ban:', error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "操作失敗",
      })
    } finally {
      setShowBanDialog(false)
      setSelectedUser(null)
    }
  }

  const canManageUser = (user: ExtendedProfile) => {
    if (!currentAdminRole) return false
    if (currentAdminRole === 'super_admin') return true
    if (currentAdminRole === 'admin' && user.admin_role !== 'super_admin') return true
    return false
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">用戶管理</h1>
          <p className="text-muted-foreground">管理系統中的所有用戶</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋用戶..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用戶資訊</TableHead>
              <TableHead>用戶名</TableHead>
              <TableHead>註冊時間</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  載入中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  沒有找到用戶
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={user.avatar_url || '/default-avatar.png'}
                          alt={user.username || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <span className="text-destructive font-medium">已封禁</span>
                    ) : (
                      <span className="text-green-600 font-medium">正常</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.admin_role ? (
                      <div className="flex items-center gap-1 text-primary">
                        <Shield className="h-4 w-4" />
                        <span className="capitalize">{user.admin_role}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">一般用戶</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {canManageUser(user) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            查看詳情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setShowBanDialog(true)
                            }}
                            className={user.is_banned ? "text-primary" : "text-destructive"}
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
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.is_banned ? "解除用戶封禁" : "封禁用戶"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_banned
                ? "確定要解除此用戶的封禁狀態嗎？解除後用戶將可以正常使用系統。"
                : "確定要封禁此用戶嗎？封禁後用戶將無法登入系統。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className={selectedUser?.is_banned ? "" : "bg-destructive"}
            >
              {selectedUser?.is_banned ? "解除封禁" : "確認封禁"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 