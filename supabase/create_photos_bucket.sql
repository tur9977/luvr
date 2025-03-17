-- 创建照片存储桶
INSERT INTO storage.buckets (id, name, public)
SELECT 'photos', 'photos', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'photos'
);

-- 删除可能存在的策略
DROP POLICY IF EXISTS "Public photos access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- 设置安全策略
-- 允许公开访问照片
CREATE POLICY "Public photos access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- 允许已认证用户上传照片
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'photos'
  );

-- 允许用户更新自己的照片
CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    auth.uid() = owner AND
    bucket_id = 'photos'
  );

-- 允许用户删除自己的照片
CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    auth.uid() = owner AND
    bucket_id = 'photos'
  );

-- 创建 event-photos 文件夹
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT 'photos', 'event-photos/.keep', auth.uid(), jsonb_build_object('mimetype', 'text/plain')
WHERE NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'photos' AND name = 'event-photos/.keep'
); 