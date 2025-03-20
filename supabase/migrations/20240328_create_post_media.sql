-- 創建更新時間戳函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建 post_media 表
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    aspect_ratio DOUBLE PRECISION NOT NULL,
    duration INTEGER,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 創建索引（如果不存在）
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'post_media_post_id_idx'
    ) THEN
        CREATE INDEX post_media_post_id_idx ON public.post_media(post_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'post_media_order_idx'
    ) THEN
        CREATE INDEX post_media_order_idx ON public.post_media("order");
    END IF;
END $$;

-- 啟用 RLS
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- 刪除現有的策略（如果存在）
DROP POLICY IF EXISTS "允許所有人讀取媒體" ON public.post_media;
DROP POLICY IF EXISTS "允許已認證用戶插入媒體" ON public.post_media;
DROP POLICY IF EXISTS "允許用戶刪除自己的媒體" ON public.post_media;

-- 創建 RLS 策略
CREATE POLICY "允許所有人讀取媒體" ON public.post_media
    FOR SELECT TO public
    USING (true);

CREATE POLICY "允許已認證用戶插入媒體" ON public.post_media
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "允許用戶刪除自己的媒體" ON public.post_media
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- 創建更新時間觸發器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_post_media_updated_at'
    ) THEN
        CREATE TRIGGER update_post_media_updated_at
            BEFORE UPDATE ON public.post_media
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$; 