-- 創建臨時表來存儲需要遷移的數據
CREATE TEMP TABLE temp_post_media AS
SELECT 
    id,
    post_id,
    media_url,
    media_type,
    aspect_ratio,
    duration,
    "order",
    created_at,
    updated_at
FROM public.post_media;

-- 清空並重建 post_media 表
TRUNCATE TABLE public.post_media CASCADE;

-- 添加 metadata 列
ALTER TABLE public.post_media ADD COLUMN metadata JSONB;

-- 重新插入數據並添加新字段
INSERT INTO public.post_media (
    id,
    post_id,
    media_url,
    media_type,
    aspect_ratio,
    duration,
    "order",
    created_at,
    updated_at,
    metadata
)
SELECT 
    id,
    post_id,
    media_url,
    media_type,
    aspect_ratio,
    duration,
    "order",
    created_at,
    updated_at,
    jsonb_build_object(
        'original_url', media_url,
        'media_type', media_type,
        'aspect_ratio', aspect_ratio,
        'duration', duration
    ) as metadata
FROM temp_post_media;

-- 刪除臨時表
DROP TABLE temp_post_media;

-- 優化索引
-- 刪除重複或未使用的索引
DROP INDEX IF EXISTS post_media_post_id_idx;
DROP INDEX IF EXISTS post_media_order_idx;
DROP INDEX IF EXISTS event_participants_event_id_idx;
DROP INDEX IF EXISTS event_participants_user_id_idx;
DROP INDEX IF EXISTS event_photos_event_id_idx;
DROP INDEX IF EXISTS event_photos_user_id_idx;
DROP INDEX IF EXISTS event_comments_event_id_idx;
DROP INDEX IF EXISTS event_comments_user_id_idx;

-- 創建新的複合索引
CREATE INDEX IF NOT EXISTS post_media_post_id_order_idx ON public.post_media(post_id, "order");
CREATE INDEX IF NOT EXISTS event_participants_event_user_idx ON public.event_participants(event_id, user_id);
CREATE INDEX IF NOT EXISTS event_photos_event_user_idx ON public.event_photos(event_id, user_id);
CREATE INDEX IF NOT EXISTS event_comments_event_user_idx ON public.event_comments(event_id, user_id);

-- 創建部分索引
CREATE INDEX IF NOT EXISTS active_posts_idx ON public.posts(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS upcoming_events_idx ON public.events(id) WHERE status = 'upcoming';
CREATE INDEX IF NOT EXISTS pending_reports_idx ON public.reports(id) WHERE status = 'pending';

-- 創建時間相關索引
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(date);

-- 更新統計信息
ANALYZE public.post_media;
ANALYZE public.event_participants;
ANALYZE public.event_photos;
ANALYZE public.event_comments;
ANALYZE public.posts;
ANALYZE public.events;
ANALYZE public.reports;

-- 創建視圖以優化常用查詢
CREATE OR REPLACE VIEW public.event_summary AS
SELECT 
    e.id,
    e.title,
    e.date,
    e.location,
    e.status,
    e.max_participants,
    COUNT(ep.user_id) as current_participants,
    COUNT(ep.user_id) FILTER (WHERE ep.status = 'going') as confirmed_participants,
    COUNT(ep.user_id) FILTER (WHERE ep.status = 'interested') as interested_participants,
    COUNT(DISTINCT ec.id) as comment_count,
    COUNT(DISTINCT eph.id) as photo_count
FROM public.events e
LEFT JOIN public.event_participants ep ON e.id = ep.event_id
LEFT JOIN public.event_comments ec ON e.id = ec.event_id
LEFT JOIN public.event_photos eph ON e.id = eph.event_id
GROUP BY e.id, e.title, e.date, e.location, e.status, e.max_participants;

-- 創建物化視圖以優化複雜查詢
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_activity_summary AS
SELECT 
    p.id as user_id,
    p.username,
    COUNT(DISTINCT posts.id) as post_count,
    COUNT(DISTINCT events.id) as event_count,
    COUNT(DISTINCT ep.event_id) as participated_events,
    COUNT(DISTINCT ec.id) as comment_count,
    COUNT(DISTINCT reports.id) as report_count
FROM public.profiles p
LEFT JOIN public.posts ON p.id = posts.user_id
LEFT JOIN public.events ON p.id = events.user_id
LEFT JOIN public.event_participants ep ON p.id = ep.user_id
LEFT JOIN public.event_comments ec ON p.id = ec.user_id
LEFT JOIN public.reports ON p.id = reports.reporter_id
GROUP BY p.id, p.username;

-- 創建刷新物化視圖的函數
CREATE OR REPLACE FUNCTION refresh_user_activity_summary()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_activity_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器以自動刷新物化視圖
DROP TRIGGER IF EXISTS refresh_user_activity_summary_trigger ON public.posts;
CREATE TRIGGER refresh_user_activity_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_activity_summary();

DROP TRIGGER IF EXISTS refresh_user_activity_summary_events_trigger ON public.events;
CREATE TRIGGER refresh_user_activity_summary_events_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.events
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_activity_summary();

DROP TRIGGER IF EXISTS refresh_user_activity_summary_comments_trigger ON public.event_comments;
CREATE TRIGGER refresh_user_activity_summary_comments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.event_comments
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_activity_summary(); 