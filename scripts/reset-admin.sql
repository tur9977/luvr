-- 重置管理員密碼
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- 獲取用戶 ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'neal@mydouble.tw';
    
    IF v_user_id IS NOT NULL THEN
        -- 更新密碼
        UPDATE auth.users
        SET 
            encrypted_password = crypt('Admin@123456', gen_salt('bf')),
            updated_at = now(),
            email_confirmed_at = now(),
            confirmation_sent_at = now(),
            is_sso_user = false,
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = '{}'::jsonb
        WHERE id = v_user_id;
        
        -- 刪除所有現有的 refresh tokens
        DELETE FROM auth.refresh_tokens WHERE user_id::text = v_user_id::text;
        
        RAISE NOTICE 'Password has been reset for user ID: %', v_user_id;
    ELSE
        RAISE EXCEPTION 'User not found';
    END IF;
END $$; 