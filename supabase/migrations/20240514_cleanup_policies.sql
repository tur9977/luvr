-- 刪除所有重複的 posts 表策略
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts or admin can delete any post" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "任何人都可以查看 posts" ON public.posts;
DROP POLICY IF EXISTS "允許已認證用戶插入貼文" ON public.posts;
DROP POLICY IF EXISTS "允許所有人讀取貼文" ON public.posts;
DROP POLICY IF EXISTS "允許用戶刪除自己的貼文" ON public.posts;
DROP POLICY IF EXISTS "允許用戶更新自己的貼文" ON public.posts;
DROP POLICY IF EXISTS "已登入用戶可以建立 posts" ON public.posts;
DROP POLICY IF EXISTS "用戶可以刪除自己的 posts" ON public.posts;
DROP POLICY IF EXISTS "用戶可以更新自己的 posts" ON public.posts;

-- 重新創建簡潔的策略
CREATE POLICY "posts_select_policy"
ON public.posts FOR SELECT
USING (true);

CREATE POLICY "posts_insert_policy"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_policy"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- 刪除所有重複的 profiles 表策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 重新創建簡潔的策略
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE
USING (auth.uid() = id); 