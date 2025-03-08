-- 首先刪除表上的所有策略
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON posts', pol.policyname);
    END LOOP;
END $$;

-- 暫時禁用 RLS
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- 刪除現有的外鍵約束
ALTER TABLE IF EXISTS posts
DROP CONSTRAINT IF EXISTS fk_posts_profiles;

ALTER TABLE IF EXISTS posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- 現在可以安全地修改列類型
ALTER TABLE IF EXISTS posts
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 添加外鍵約束
ALTER TABLE posts
ADD CONSTRAINT fk_posts_profiles
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 重新啟用 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 重新創建策略
CREATE POLICY "允許已認證用戶插入貼文"
ON posts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "允許所有人讀取貼文"
ON posts FOR SELECT
TO public
USING (true);

CREATE POLICY "允許用戶更新自己的貼文"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "允許用戶刪除自己的貼文"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 