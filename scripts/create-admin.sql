-- 直接在 auth.users 表中創建用戶
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
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
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 為新創建的用戶設置檔案和角色
DO $$
DECLARE
    v_user_id uuid;
    v_count int;
BEGIN
    -- 檢查用戶是否已存在
    SELECT COUNT(*) INTO v_count FROM auth.users WHERE email = 'neal@mydouble.tw';
    
    IF v_count = 0 THEN
        -- 創建新用戶
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
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
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Created new user with ID: %', v_user_id;
    ELSE
        -- 獲取現有用戶 ID
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'neal@mydouble.tw';
        RAISE NOTICE 'User already exists with ID: %', v_user_id;
    END IF;

    -- 創建用戶檔案
    INSERT INTO public.profiles (id, username, full_name)
    SELECT v_user_id, 'admin', '系統管理員'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_user_id
    );
    
    -- 設置超級管理員角色
    INSERT INTO public.admin_roles (user_id, role)
    SELECT v_user_id, 'super_admin'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.admin_roles WHERE user_id = v_user_id
    );
    
    RAISE NOTICE 'Setup completed successfully for user ID: %', v_user_id;
END $$; 