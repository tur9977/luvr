-- 在 Supabase Studio 中執行以下命令來創建存儲桶
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- 刪除現有的策略（如果存在）
DROP POLICY IF EXISTS "允許已認證用戶上傳文件" ON storage.objects;
DROP POLICY IF EXISTS "允許所有人讀取文件" ON storage.objects;
DROP POLICY IF EXISTS "允許用戶刪除自己的文件" ON storage.objects;

-- 設置存儲桶的安全策略
create policy "允許已認證用戶上傳文件"
on storage.objects for insert
to authenticated
with check (bucket_id = 'posts');

create policy "允許所有人讀取文件"
on storage.objects for select
to public
using (bucket_id = 'posts');

create policy "允許用戶刪除自己的文件"
on storage.objects for delete
to authenticated
using (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 設置文件大小限制（50MB）和允許的文件類型
update storage.buckets
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'video/mp4', 
      'video/webm', 
      'video/quicktime'  -- 增加對 .mov 格式的支持
    ]
where id = 'posts'; 