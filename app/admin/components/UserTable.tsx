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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { Database } from "@/lib/types/database.types"

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  posts: { count: number } | null
  reports: { count: number } | null
}

interface UserTableProps {
  users: Profile[]
}

export function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const supabase = createClientComponentClient<Database>()

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .rpc('admin_update_user_role', {
          target_user_id: userId,
          new_role: newRole
        })

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))
      
      toast.success(`已將用戶角色更改為${newRole === 'admin' ? '管理員' : '一般用戶'}`)
    } catch (error) {
      console.error('更改角色時出錯:', error)
      toast.error('更改角色失敗')
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
                  <Avatar>
                    <AvatarImage src={user.avatar_url || '/placeholder.svg'} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium">
                    {user.username}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={user.role === 'admin' ? 'text-primary font-medium' : ''}>
                  {user.role === 'admin' ? '管理員' : '一般用戶'}
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
                    {user.role === 'user' ? (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        設為管理員
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, 'user')}
                      >
                        取消管理員
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