-- 檢查 posts 表結構
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts';

-- 檢查 posts 表的行級安全策略
SELECT *
FROM pg_policies
WHERE tablename = 'posts';

-- 設置 posts 表的行級安全策略
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 刪除現有的策略（如果存在）
DROP POLICY IF EXISTS "允許已認證用戶插入貼文" ON posts;
DROP POLICY IF EXISTS "允許所有人讀取貼文" ON posts;
DROP POLICY IF EXISTS "允許用戶刪除自己的貼文" ON posts;
DROP POLICY IF EXISTS "允許用戶更新自己的貼文" ON posts;

-- 創建新的策略
CREATE POLICY "允許已認證用戶插入貼文" ON posts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "允許所有人讀取貼文" ON posts
    FOR SELECT TO public
    USING (true);

CREATE POLICY "允許用戶刪除自己的貼文" ON posts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "允許用戶更新自己的貼文" ON posts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 檢查 posts 表是否存在
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') THEN
    -- 創建 posts 表
    CREATE TABLE posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
      thumbnail_url TEXT,
      aspect_ratio FLOAT NOT NULL,
      duration INTEGER,
      caption TEXT,
      location TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 添加外鍵約束到 profiles 表
    ALTER TABLE posts
    ADD CONSTRAINT fk_posts_profiles
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

    -- 啟用 RLS
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

    -- 創建政策
    CREATE POLICY "允許已認證用戶創建貼文"
    ON posts FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "允許所有人查看貼文"
    ON posts FOR SELECT
    TO authenticated
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
  END IF;
END $$; 