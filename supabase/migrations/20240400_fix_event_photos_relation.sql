-- 创建从event_photos到profiles的关系
comment on column public.event_photos.user_id is 'References the user who uploaded the photo';

-- 添加显式外键关系名称
alter table public.event_photos drop constraint if exists event_photos_user_id_fkey;
alter table public.event_photos add constraint event_photos_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- 确保外键索引存在
create index if not exists event_photos_user_id_idx on public.event_photos(user_id); 