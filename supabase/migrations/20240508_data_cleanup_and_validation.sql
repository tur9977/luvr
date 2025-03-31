-- 刪除觸發器
DROP TRIGGER IF EXISTS validate_post_media_insert_trigger ON public.post_media;

-- 刪除現有函數
DROP FUNCTION IF EXISTS validate_post_media_data();
DROP FUNCTION IF EXISTS cleanup_invalid_post_media();
DROP FUNCTION IF EXISTS repair_post_media_metadata();
DROP FUNCTION IF EXISTS check_data_consistency();
DROP FUNCTION IF EXISTS rollback_post_media_changes();
DROP FUNCTION IF EXISTS validate_post_media_insert();

-- 創建數據驗證函數
CREATE OR REPLACE FUNCTION validate_post_media_data()
RETURNS TABLE (
    post_id UUID,
    media_count BIGINT,
    has_invalid_metadata BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as post_id,
        COUNT(pm.id) as media_count,
        BOOL_OR(pm.metadata IS NULL OR NOT pm.metadata ? 'original_url') as has_invalid_metadata
    FROM public.posts p
    LEFT JOIN public.post_media pm ON p.id = pm.post_id
    GROUP BY p.id
    HAVING COUNT(pm.id) > 0;
END;
$$ LANGUAGE plpgsql;

-- 創建數據清理函數
CREATE OR REPLACE FUNCTION cleanup_invalid_post_media()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- 刪除沒有關聯到有效帖子的媒體
    DELETE FROM public.post_media
    WHERE post_id NOT IN (SELECT id FROM public.posts)
    RETURNING id INTO cleaned_count;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- 創建數據修復函數
CREATE OR REPLACE FUNCTION repair_post_media_metadata()
RETURNS INTEGER AS $$
DECLARE
    repaired_count INTEGER := 0;
BEGIN
    -- 修復缺少元數據的記錄
    UPDATE public.post_media
    SET metadata = jsonb_build_object(
        'original_url', media_url,
        'media_type', media_type,
        'aspect_ratio', aspect_ratio,
        'duration', duration
    )
    WHERE metadata IS NULL
    RETURNING id INTO repaired_count;
    
    RETURN repaired_count;
END;
$$ LANGUAGE plpgsql;

-- 創建數據一致性檢查函數
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- 檢查帖子計數
    SELECT 
        'Post Count Check' as check_name,
        CASE 
            WHEN COUNT(*) = (SELECT COUNT(*) FROM public.posts) THEN 'OK'
            ELSE 'MISMATCH'
        END as status,
        'Checking if post counts match across tables' as details
    FROM (
        SELECT COUNT(*) FROM public.posts
        UNION ALL
        SELECT COUNT(*) FROM public.post_media
        UNION ALL
        SELECT COUNT(*) FROM public.likes
        UNION ALL
        SELECT COUNT(*) FROM public.comments
    ) counts;
    
    RETURN QUERY
    -- 檢查事件計數
    SELECT 
        'Event Count Check' as check_name,
        CASE 
            WHEN COUNT(*) = (SELECT COUNT(*) FROM public.events) THEN 'OK'
            ELSE 'MISMATCH'
        END as status,
        'Checking if event counts match across tables' as details
    FROM (
        SELECT COUNT(*) FROM public.events
        UNION ALL
        SELECT COUNT(*) FROM public.event_participants
        UNION ALL
        SELECT COUNT(*) FROM public.event_comments
        UNION ALL
        SELECT COUNT(*) FROM public.event_photos
    ) counts;
    
    RETURN QUERY
    -- 檢查用戶計數
    SELECT 
        'User Count Check' as check_name,
        CASE 
            WHEN COUNT(*) = (SELECT COUNT(*) FROM public.profiles) THEN 'OK'
            ELSE 'MISMATCH'
        END as status,
        'Checking if user counts match across tables' as details
    FROM (
        SELECT COUNT(*) FROM public.profiles
        UNION ALL
        SELECT COUNT(DISTINCT user_id) FROM public.posts
        UNION ALL
        SELECT COUNT(DISTINCT user_id) FROM public.events
        UNION ALL
        SELECT COUNT(DISTINCT user_id) FROM public.event_participants
    ) counts;
END;
$$ LANGUAGE plpgsql;

-- 創建回滾函數
CREATE OR REPLACE FUNCTION rollback_post_media_changes()
RETURNS void AS $$
BEGIN
    -- 刪除 metadata 列
    ALTER TABLE public.post_media DROP COLUMN IF EXISTS metadata;
    
    -- 恢復原始索引
    DROP INDEX IF EXISTS post_media_post_id_order_idx;
    CREATE INDEX IF NOT EXISTS post_media_post_id_idx ON public.post_media(post_id);
    CREATE INDEX IF NOT EXISTS post_media_order_idx ON public.post_media("order");
END;
$$ LANGUAGE plpgsql;

-- 創建數據驗證觸發器
CREATE OR REPLACE FUNCTION validate_post_media_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- 確保 metadata 不為空
    IF NEW.metadata IS NULL THEN
        NEW.metadata := jsonb_build_object(
            'original_url', NEW.media_url,
            'media_type', NEW.media_type,
            'aspect_ratio', NEW.aspect_ratio,
            'duration', NEW.duration
        );
    END IF;
    
    -- 確保 post_id 存在
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = NEW.post_id) THEN
        RAISE EXCEPTION 'Invalid post_id: %', NEW.post_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
CREATE TRIGGER validate_post_media_insert_trigger
    BEFORE INSERT OR UPDATE ON public.post_media
    FOR EACH ROW
    EXECUTE FUNCTION validate_post_media_insert();

-- 執行數據清理和驗證
DO $$
DECLARE
    cleaned_count INTEGER;
    repaired_count INTEGER;
    consistency_check RECORD;
BEGIN
    -- 清理無效數據
    cleaned_count := cleanup_invalid_post_media();
    RAISE NOTICE 'Cleaned % invalid post media records', cleaned_count;
    
    -- 修復元數據
    repaired_count := repair_post_media_metadata();
    RAISE NOTICE 'Repaired % post media metadata records', repaired_count;
    
    -- 檢查數據一致性
    FOR consistency_check IN SELECT * FROM check_data_consistency() LOOP
        RAISE NOTICE 'Check: %, Status: %, Details: %', 
            consistency_check.check_name, 
            consistency_check.status, 
            consistency_check.details;
    END LOOP;
END $$; 