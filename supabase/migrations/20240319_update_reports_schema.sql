-- 檢查並重命名欄位（如果存在的話）
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'post_id'
    ) THEN
        ALTER TABLE public.reports 
        RENAME COLUMN post_id TO reported_content_id;
        
        -- 更新外鍵約束
        ALTER TABLE public.reports 
        DROP CONSTRAINT IF EXISTS fk_reports_posts;

        -- 更新唯一約束
        ALTER TABLE public.reports 
        DROP CONSTRAINT IF EXISTS reports_post_id_reporter_id_key;
    END IF;
END $$;

-- 確保外鍵約束存在
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reports_posts'
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT fk_reports_posts 
        FOREIGN KEY (reported_content_id) 
        REFERENCES public.posts(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 確保唯一約束存在
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'reports_reported_content_id_reporter_id_key'
    ) THEN
        ALTER TABLE public.reports 
        ADD CONSTRAINT reports_reported_content_id_reporter_id_key 
        UNIQUE (reported_content_id, reporter_id);
    END IF;
END $$;

-- 添加 reported_user_id 欄位（如果還沒有的話）
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 更新 reported_user_id 的值（從 posts 表獲取）
UPDATE public.reports r 
SET reported_user_id = p.user_id 
FROM public.posts p 
WHERE r.reported_content_id = p.id 
AND r.reported_user_id IS NULL;

-- 添加 admin_note 欄位（如果還沒有的話）
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS admin_note text;

-- 添加 resolved_by 欄位（如果還沒有的話）
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 刪除觸發器（如果存在）然後重新創建
DROP TRIGGER IF EXISTS update_report_resolved_at ON public.reports;

-- 確保觸發器函數存在
CREATE OR REPLACE FUNCTION public.handle_report_status_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
        NEW.resolved_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
CREATE TRIGGER update_report_resolved_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_report_status_change();

-- 更新表和欄位的註解
COMMENT ON TABLE public.reports IS '用戶檢舉記錄表';
COMMENT ON COLUMN public.reports.id IS '檢舉記錄 ID';
COMMENT ON COLUMN public.reports.reported_content_id IS '被檢舉的內容 ID';
COMMENT ON COLUMN public.reports.reporter_id IS '檢舉者 ID';
COMMENT ON COLUMN public.reports.reported_user_id IS '被檢舉的用戶 ID';
COMMENT ON COLUMN public.reports.reason IS '檢舉原因';
COMMENT ON COLUMN public.reports.status IS '檢舉狀態：pending（待處理）、approved（已批准）、rejected（已拒絕）';
COMMENT ON COLUMN public.reports.admin_note IS '管理員處理備註';
COMMENT ON COLUMN public.reports.created_at IS '檢舉時間';
COMMENT ON COLUMN public.reports.resolved_at IS '處理時間';
COMMENT ON COLUMN public.reports.resolved_by IS '處理者 ID'; 