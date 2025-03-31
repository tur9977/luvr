-- 更新 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 合併 notification_preferences 到新的 preferences 字段
DO $$ 
BEGIN
    -- 如果 notification_preferences 存在，將其合併到新的 preferences 字段
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'notification_preferences'
    ) THEN
        -- 創建臨時表來存儲現有的通知偏好
        CREATE TEMP TABLE temp_preferences AS
        SELECT id, notification_preferences
        FROM public.profiles
        WHERE notification_preferences IS NOT NULL;

        -- 添加新的 preferences 字段
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{
          "theme": "light",
          "language": "zh-TW",
          "notifications": {
            "email": true,
            "push": true,
            "sms": false
          }
        }'::jsonb;

        -- 更新 preferences 字段，合併現有的通知偏好
        UPDATE public.profiles p
        SET preferences = jsonb_set(
            COALESCE(p.preferences, '{}'::jsonb),
            '{notifications}',
            COALESCE(tp.notification_preferences, '{}'::jsonb)
        )
        FROM temp_preferences tp
        WHERE p.id = tp.id;

        -- 刪除舊的 notification_preferences 字段
        ALTER TABLE public.profiles
        DROP COLUMN IF EXISTS notification_preferences;
    ELSE
        -- 如果 notification_preferences 不存在，直接添加新的 preferences 字段
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{
          "theme": "light",
          "language": "zh-TW",
          "notifications": {
            "email": true,
            "push": true,
            "sms": false
          }
        }'::jsonb;
    END IF;
END $$;

-- 更新 posts 表
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));

-- 更新 events 表
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS max_participants integer,
ADD COLUMN IF NOT EXISTS registration_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TWD',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled'));

-- 更新 reports 表
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'content' CHECK (report_type IN ('content', 'user', 'event')),
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS evidence jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS resolution_details jsonb DEFAULT '{}'::jsonb;

-- 創建新的索引
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS posts_visibility_status_idx ON public.posts(visibility, status);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON public.posts USING gin(tags);
CREATE INDEX IF NOT EXISTS events_status_date_idx ON public.events(status, date);
CREATE INDEX IF NOT EXISTS events_tags_idx ON public.events USING gin(tags);
CREATE INDEX IF NOT EXISTS reports_type_status_idx ON public.reports(report_type, status);
CREATE INDEX IF NOT EXISTS reports_severity_idx ON public.reports(severity);

-- 更新表和字段的註釋
COMMENT ON COLUMN public.profiles.phone IS '用戶電話號碼';
COMMENT ON COLUMN public.profiles.website IS '用戶個人網站';
COMMENT ON COLUMN public.profiles.social_links IS '社交媒體連結';
COMMENT ON COLUMN public.profiles.preferences IS '用戶偏好設置，包含主題、語言和通知設置';

COMMENT ON COLUMN public.posts.visibility IS '貼文可見性：public=公開, friends=好友可見, private=私密';
COMMENT ON COLUMN public.posts.tags IS '貼文標籤';
COMMENT ON COLUMN public.posts.metadata IS '貼文元數據';
COMMENT ON COLUMN public.posts.status IS '貼文狀態：active=活躍, archived=已歸檔, deleted=已刪除';

COMMENT ON COLUMN public.events.max_participants IS '最大參與人數';
COMMENT ON COLUMN public.events.registration_deadline IS '報名截止時間';
COMMENT ON COLUMN public.events.price IS '活動價格';
COMMENT ON COLUMN public.events.currency IS '貨幣單位';
COMMENT ON COLUMN public.events.tags IS '活動標籤';
COMMENT ON COLUMN public.events.metadata IS '活動元數據';
COMMENT ON COLUMN public.events.status IS '活動狀態：draft=草稿, upcoming=即將開始, ongoing=進行中, completed=已完成, cancelled=已取消';

COMMENT ON COLUMN public.reports.report_type IS '檢舉類型：content=內容, user=用戶, event=活動';
COMMENT ON COLUMN public.reports.severity IS '嚴重程度：low=低, medium=中, high=高';
COMMENT ON COLUMN public.reports.evidence IS '證據資料';
COMMENT ON COLUMN public.reports.resolution_details IS '處理詳情'; 