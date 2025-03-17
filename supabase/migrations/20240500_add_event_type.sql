-- 向events表添加event_type字段
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'other';

-- 为event_type字段添加约束（确保只能使用允许的类型）
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('social', 'sports', 'education', 'entertainment', 'business', 'other'));

-- 为event_type字段添加注释
COMMENT ON COLUMN public.events.event_type IS '活动类型 (social=社交聚会, sports=运动活动, education=教育讲座, entertainment=娱乐表演, business=商业交流, other=其他)';

-- 创建索引以便于按类型筛选
CREATE INDEX IF NOT EXISTS events_event_type_idx ON public.events(event_type);

-- 更新现有记录的event_type字段为'other'（如果字段已存在且为null）
UPDATE public.events SET event_type = 'other' WHERE event_type IS NULL; 