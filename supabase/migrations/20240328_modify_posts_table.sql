-- 移除媒體相關欄位
ALTER TABLE public.posts
    DROP COLUMN IF EXISTS media_url,
    DROP COLUMN IF EXISTS media_type,
    DROP COLUMN IF EXISTS thumbnail_url,
    DROP COLUMN IF EXISTS aspect_ratio,
    DROP COLUMN IF EXISTS duration,
    DROP COLUMN IF EXISTS media_urls; 