-- 確保存儲桶存在
insert into storage.buckets (id, name)
values ('posts', 'posts')
on conflict (id) do nothing;

-- 啟用 RLS
alter table storage.objects enable row level security;

-- 刪除現有策略（如果存在）
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;

-- 創建新的策略
-- 允許公開讀取
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'posts' );

-- 允許認證用戶上傳文件
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'posts' );

-- 允許用戶刪除自己的文件
create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'posts' ); 