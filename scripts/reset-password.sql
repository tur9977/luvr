-- 重置用戶密碼
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- 先刪除現有用戶（如果存在）
    DELETE FROM auth.users WHERE email = 'neal@mydouble.tw';
    
    -- 創建新用戶
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'neal@mydouble.tw',
        crypt('Admin@123456', gen_salt('bf')),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        now(),
        now(),
        null,
        null,
        '',
        '',
        '',
        ''
    ) RETURNING id INTO v_user_id;

    -- 創建用戶檔案
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (v_user_id, 'admin', '系統管理員')
    ON CONFLICT (id) DO NOTHING;

    -- 設置超級管理員角色
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Created new admin user with ID: %', v_user_id;
END $$; 