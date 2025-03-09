-- 檢查用戶是否存在
DO $$
DECLARE
    v_user_id uuid;
    v_count int;
BEGIN
    -- 檢查是否已有超級管理員
    SELECT COUNT(*) INTO v_count FROM admin_roles WHERE role = 'super_admin';
    
    IF v_count = 0 THEN
        -- 檢查用戶是否存在
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'neal@mydouble.tw';
        
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'User not found. Please create the user first through the auth system.';
        END IF;
        
        -- 創建用戶檔案（如果不存在）
        INSERT INTO public.profiles (id, username, full_name)
        VALUES (v_user_id, 'admin', '系統管理員')
        ON CONFLICT (id) DO NOTHING;
        
        -- 設置超級管理員角色
        INSERT INTO public.admin_roles (user_id, role)
        VALUES (v_user_id, 'super_admin');
        
        RAISE NOTICE 'Super admin role has been set up successfully.';
    ELSE
        RAISE NOTICE 'Super admin already exists.';
    END IF;
END $$; 