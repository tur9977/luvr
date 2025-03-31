-- 檢查函數是否成功創建
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'validate_post_media_data',
    'cleanup_invalid_post_media',
    'repair_post_media_metadata',
    'check_data_consistency',
    'rollback_post_media_changes',
    'validate_post_media_insert'
)
ORDER BY p.proname;

-- 檢查觸發器是否成功創建
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'post_media'
AND t.tgname = 'validate_post_media_insert_trigger';

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
WHERE tablename = 'post_media'
ORDER BY indexname;

-- 執行數據驗證並顯示結果
SELECT * FROM validate_post_media_data();

-- 執行數據一致性檢查並顯示結果
SELECT * FROM check_data_consistency();

-- 檢查 post_media 表中的數據
SELECT 
    id,
    post_id,
    media_url,
    media_type,
    metadata
FROM public.post_media
LIMIT 5; 