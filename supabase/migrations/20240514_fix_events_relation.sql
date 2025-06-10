-- 確保 events 表有正確的外鍵關聯
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_creator_id_fkey;

ALTER TABLE public.events
ADD CONSTRAINT events_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 添加 RLS 策略
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 刪除已存在的策略
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- 創建新的策略
CREATE POLICY "events_select_policy"
ON public.events FOR SELECT
USING (true);

CREATE POLICY "events_insert_policy"
ON public.events FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "events_update_policy"
ON public.events FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "events_delete_policy"
ON public.events FOR DELETE
USING (auth.uid() = creator_id);

-- 驗證關聯
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'events'; 