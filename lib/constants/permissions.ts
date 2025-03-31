export type Permission = 
  | 'read:posts'
  | 'write:posts'
  | 'delete:posts'
  | 'read:events'
  | 'write:events'
  | 'delete:events'
  | 'read:reports'
  | 'write:reports'
  | 'delete:reports'
  | 'manage:users'
  | 'manage:content'
  | 'manage:system'

export type Role = 'user' | 'admin' | 'banned'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    'read:posts',
    'write:posts',
    'delete:posts',
    'read:events',
    'write:events',
    'read:reports'
  ],
  admin: [
    'read:posts',
    'write:posts',
    'delete:posts',
    'read:events',
    'write:events',
    'delete:events',
    'read:reports',
    'write:reports',
    'delete:reports',
    'manage:users',
    'manage:content',
    'manage:system'
  ],
  banned: []
}

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'read:posts': '查看貼文',
  'write:posts': '發布貼文',
  'delete:posts': '刪除貼文',
  'read:events': '查看活動',
  'write:events': '發布活動',
  'delete:events': '刪除活動',
  'read:reports': '查看檢舉',
  'write:reports': '處理檢舉',
  'delete:reports': '刪除檢舉',
  'manage:users': '管理用戶',
  'manage:content': '管理內容',
  'manage:system': '管理系統'
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: '一般用戶',
  admin: '管理員',
  banned: '已封禁用戶'
} 