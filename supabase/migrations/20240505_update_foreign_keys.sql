-- 更新 posts 表的外鍵約束
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS fk_posts_profiles,
ADD CONSTRAINT fk_posts_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE RESTRICT;  -- 防止刪除用戶時自動刪除其貼文

-- 更新 reports 表的外鍵約束
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS fk_reports_posts,
ADD CONSTRAINT fk_reports_posts
FOREIGN KEY (reported_content_id)
REFERENCES public.posts(id)
ON DELETE RESTRICT;  -- 防止刪除貼文時自動刪除相關檢舉

-- 更新 reports 表的用戶相關外鍵約束
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey,
ADD CONSTRAINT reports_reported_user_id_fkey
FOREIGN KEY (reported_user_id)
REFERENCES public.profiles(id)
ON DELETE RESTRICT;  -- 防止刪除用戶時自動刪除相關檢舉

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
ADD CONSTRAINT reports_reporter_id_fkey
FOREIGN KEY (reporter_id)
REFERENCES public.profiles(id)
ON DELETE RESTRICT;  -- 防止刪除用戶時自動刪除其提交的檢舉

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_resolved_by_fkey,
ADD CONSTRAINT reports_resolved_by_fkey
FOREIGN KEY (resolved_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;  -- 當管理員被刪除時，將處理者設為 NULL

-- 創建觸發器函數來處理用戶刪除
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger AS $$
BEGIN
    -- 檢查用戶是否有相關數據
    IF EXISTS (
        SELECT 1 FROM public.posts WHERE user_id = OLD.id
    ) OR EXISTS (
        SELECT 1 FROM public.reports 
        WHERE reporter_id = OLD.id 
        OR reported_user_id = OLD.id
    ) THEN
        RAISE EXCEPTION '無法刪除用戶，因為該用戶還有相關的貼文或檢舉記錄';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS check_user_deletion ON public.profiles;
CREATE TRIGGER check_user_deletion
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();

-- 更新約束的註釋
COMMENT ON CONSTRAINT fk_posts_profiles ON public.posts IS '關聯到用戶檔案的外鍵約束，刪除用戶時需要先處理其貼文';
COMMENT ON CONSTRAINT fk_reports_posts ON public.reports IS '關聯到被檢舉內容的外鍵約束，刪除貼文時需要先處理相關檢舉';
COMMENT ON CONSTRAINT reports_reported_user_id_fkey ON public.reports IS '關聯到被檢舉用戶的外鍵約束，刪除用戶時需要先處理相關檢舉';
COMMENT ON CONSTRAINT reports_reporter_id_fkey ON public.reports IS '關聯到檢舉者的外鍵約束，刪除用戶時需要先處理其提交的檢舉';
COMMENT ON CONSTRAINT reports_resolved_by_fkey ON public.reports IS '關聯到處理檢舉的管理員，刪除管理員時將處理者設為 NULL'; 