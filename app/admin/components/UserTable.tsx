"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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
import { UserAvatar } from "@/components/ui/user-avatar"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { Profile, UserRole } from "@/lib/types/profiles"
import type { Database } from "@/lib/types/database.types"

interface UserTableProps {
  users: Profile[]
}

export function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const supabase = createClientComponentClient<Database>()

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登入')

      const { data, error } = await supabase
        .rpc('admin_role', {
          admin_id: user.id,
          target_user_id: userId,
          new_role: newRole,
          reason: '管理員更改用戶角色'
        })

      if (error) throw error
      if (!data) throw new Error('更改角色失敗')

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))
      
      const roleLabels: Record<UserRole, string> = {
        normal_user: '一般用戶',
        banned_user: '禁封用戶',
        verified_user: '認證用戶',
        brand_user: '品牌用戶',
        admin: '管理員'
      }
      
      toast.success(`已將用戶角色更改為${roleLabels[newRole]}`)
    } catch (error) {
      console.error('更改角色時出錯:', error)
      toast.error('更改角色失敗')
    }
  }

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      normal_user: '一般用戶',
      banned_user: '禁封用戶',
      verified_user: '認證用戶',
      brand_user: '品牌用戶',
      admin: '管理員'
    }
    return roleLabels[role] || '一般用戶'
  }

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'text-primary font-medium'
      case 'banned_user':
        return 'text-destructive font-medium'
      case 'verified_user':
        return 'text-blue-500 font-medium'
      case 'brand_user':
        return 'text-yellow-600 font-medium'
      default:
        return ''
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        目前沒有任何用戶
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用戶</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>貼文數</TableHead>
            <TableHead>檢舉數</TableHead>
            <TableHead>註冊時間</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatar_url}
                    role={user.role}
                  />
                  <div className="font-medium">
                    {user.username}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={getRoleStyle(user.role as UserRole)}>
                  {getRoleLabel(user.role as UserRole)}
                </span>
              </TableCell>
              <TableCell>{user.posts?.count || 0}</TableCell>
              <TableCell>{user.reports?.count || 0}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                  locale: zhTW
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">打開選單</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.role !== 'admin' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                        設為管理員
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'normal_user' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'normal_user')}>
                        設為一般用戶
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'verified_user' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'verified_user')}>
                        設為認證用戶
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'brand_user' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'brand_user')}>
                        設為品牌用戶
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'banned_user' && (
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user.id, 'banned_user')}
                        className="text-destructive"
                      >
                        禁封用戶
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 