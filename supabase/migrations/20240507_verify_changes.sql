-- 檢查 post_media 表的結構
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_media'
ORDER BY ordinal_position;

-- 檢查索引
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('post_media', 'posts', 'events', 'reports')
ORDER BY tablename, indexname;

-- 檢查視圖
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('event_summary', 'user_activity_summary');

-- 檢查物化視圖
SELECT 
    matviewname,
    matviewowner,
    definition
FROM pg_matviews
WHERE schemaname = 'public'
AND matviewname = 'user_activity_summary';

-- 檢查觸發器
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('posts', 'events', 'event_comments')
ORDER BY c.relname, t.tgname; 