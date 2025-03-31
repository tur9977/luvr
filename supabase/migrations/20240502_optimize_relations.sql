-- 優化 post_media 表
ALTER TABLE public.post_media
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 優化 event_participants 表
ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS check_in_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 優化 event_photos 表
ALTER TABLE public.event_photos
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_cover boolean DEFAULT false;

-- 優化 event_comments 表
ALTER TABLE public.event_comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.event_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 創建新的索引
CREATE INDEX IF NOT EXISTS post_media_metadata_idx ON public.post_media USING gin(metadata);
CREATE INDEX IF NOT EXISTS event_participants_payment_status_idx ON public.event_participants(payment_status);
CREATE INDEX IF NOT EXISTS event_participants_check_in_time_idx ON public.event_participants(check_in_time);
CREATE INDEX IF NOT EXISTS event_photos_is_cover_idx ON public.event_photos(is_cover);
CREATE INDEX IF NOT EXISTS event_comments_parent_id_idx ON public.event_comments(parent_id);
CREATE INDEX IF NOT EXISTS event_comments_created_at_idx ON public.event_comments(created_at);

-- 更新表和字段的註釋
COMMENT ON COLUMN public.post_media.thumbnail_url IS '縮圖URL';
COMMENT ON COLUMN public.post_media.duration IS '媒體時長（秒）';
COMMENT ON COLUMN public.post_media.width IS '媒體寬度';
COMMENT ON COLUMN public.post_media.height IS '媒體高度';
COMMENT ON COLUMN public.post_media.file_size IS '文件大小（字節）';
COMMENT ON COLUMN public.post_media.mime_type IS 'MIME類型';
COMMENT ON COLUMN public.post_media.metadata IS '媒體元數據';

COMMENT ON COLUMN public.event_participants.payment_status IS '支付狀態：pending=待支付, paid=已支付, refunded=已退款, cancelled=已取消';
COMMENT ON COLUMN public.event_participants.payment_details IS '支付詳情';
COMMENT ON COLUMN public.event_participants.check_in_time IS '簽到時間';
COMMENT ON COLUMN public.event_participants.notes IS '備註';
COMMENT ON COLUMN public.event_participants.metadata IS '參與者元數據';

COMMENT ON COLUMN public.event_photos.width IS '照片寬度';
COMMENT ON COLUMN public.event_photos.height IS '照片高度';
COMMENT ON COLUMN public.event_photos.file_size IS '文件大小（字節）';
COMMENT ON COLUMN public.event_photos.mime_type IS 'MIME類型';
COMMENT ON COLUMN public.event_photos.metadata IS '照片元數據';
COMMENT ON COLUMN public.event_photos.is_cover IS '是否為封面照片';

COMMENT ON COLUMN public.event_comments.parent_id IS '父評論ID';
COMMENT ON COLUMN public.event_comments.is_edited IS '是否已編輯';
COMMENT ON COLUMN public.event_comments.edited_at IS '編輯時間';
COMMENT ON COLUMN public.event_comments.metadata IS '評論元數據';

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION public.handle_event_photo_cover()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_cover = true THEN
        UPDATE public.event_photos
        SET is_cover = false
        WHERE event_id = NEW.event_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS update_event_photo_cover ON public.event_photos;
CREATE TRIGGER update_event_photo_cover
    BEFORE INSERT OR UPDATE ON public.event_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_event_photo_cover(); 