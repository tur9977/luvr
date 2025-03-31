-- 修正 posts 表的外鍵約束
DO $$ 
BEGIN
    -- 刪除重複的外鍵約束
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'posts' 
        AND constraint_name = 'posts_user_id_fkey'
    ) THEN
        ALTER TABLE public.posts
        DROP CONSTRAINT posts_user_id_fkey;
    END IF;

    -- 確保使用正確的外鍵約束
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'posts' 
        AND constraint_name = 'fk_posts_profiles'
    ) THEN
        ALTER TABLE public.posts
        ADD CONSTRAINT fk_posts_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 修正 reports 表的外鍵和唯一約束
DO $$ 
BEGIN
    -- 刪除重複的外鍵約束
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reports' 
        AND constraint_name = 'reports_reported_content_id_fkey'
    ) THEN
        ALTER TABLE public.reports
        DROP CONSTRAINT reports_reported_content_id_fkey;
    END IF;

    -- 刪除重複的唯一約束
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reports' 
        AND constraint_name = 'reports_unique_report'
    ) THEN
        ALTER TABLE public.reports
        DROP CONSTRAINT reports_unique_report;
    END IF;

    -- 確保使用正確的外鍵約束
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reports' 
        AND constraint_name = 'fk_reports_posts'
    ) THEN
        ALTER TABLE public.reports
        ADD CONSTRAINT fk_reports_posts
        FOREIGN KEY (reported_content_id)
        REFERENCES public.posts(id)
        ON DELETE CASCADE;
    END IF;

    -- 確保使用正確的唯一約束
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reports' 
        AND constraint_name = 'reports_reported_content_id_reporter_id_key'
    ) THEN
        ALTER TABLE public.reports
        ADD CONSTRAINT reports_reported_content_id_reporter_id_key
        UNIQUE (reported_content_id, reporter_id);
    END IF;
END $$;

-- 更新約束的註釋
COMMENT ON CONSTRAINT fk_posts_profiles ON public.posts IS '關聯到用戶檔案的外鍵約束';
COMMENT ON CONSTRAINT fk_reports_posts ON public.reports IS '關聯到被檢舉內容的外鍵約束';
COMMENT ON CONSTRAINT reports_reported_content_id_reporter_id_key ON public.reports IS '確保同一用戶不會重複檢舉同一內容';

-- 創建索引以優化外鍵查詢
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS reports_reported_content_id_idx ON public.reports(reported_content_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_user_id_idx ON public.reports(reported_user_id); 