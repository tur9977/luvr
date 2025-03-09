-- 重置 admin_roles 表的設置
BEGIN;

-- 禁用 RLS
ALTER TABLE public.admin_roles DISABLE ROW LEVEL SECURITY;

-- 刪除現有的策略
DROP POLICY IF EXISTS "允許管理員查看角色" ON public.admin_roles;
DROP POLICY IF EXISTS "允許所有人查看自己的角色" ON public.admin_roles;

-- 重新授予基本權限
REVOKE ALL ON public.admin_roles FROM anon, authenticated;
GRANT ALL ON public.admin_roles TO authenticated;
GRANT SELECT ON public.admin_roles TO anon;

-- 確認當前管理員記錄
SELECT * FROM public.admin_roles;

-- 如果需要，重新插入管理員記錄
INSERT INTO public.admin_roles (user_id, role)
SELECT '3fafbd86-0270-4190-9456-26922221c41c', 'super_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = '3fafbd86-0270-4190-9456-26922221c41c'
);

COMMIT; 