-- 為 admin_roles 表啟用 RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 刪除現有的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "允許管理員查看角色" ON public.admin_roles;
DROP POLICY IF EXISTS "允許所有人查看自己的角色" ON public.admin_roles;

-- 創建新的 RLS 策略
CREATE POLICY "允許所有人查看自己的角色" ON public.admin_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 創建新的 RLS 策略允許管理員查看所有角色
CREATE POLICY "允許管理員查看角色" ON public.admin_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role IN ('super_admin', 'admin')
    )
  );

-- 確保表的權限正確設置
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT SELECT ON public.admin_roles TO anon;

-- 顯示當前用戶的角色（用於調試）
SELECT * FROM public.admin_roles WHERE user_id = '3fafbd86-0270-4190-9456-26922221c41c'; 