-- 創建關注關係表
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 主鍵確保一個用戶只能關注另一個用戶一次
  primary key (follower_id, following_id),
  
  -- 確保用戶不能關注自己
  constraint follows_no_self_follow check (follower_id != following_id)
);

-- 為關注關係表添加註釋
comment on table public.follows is '用戶關注關係表';
comment on column public.follows.follower_id is '關注者的用戶ID';
comment on column public.follows.following_id is '被關注者的用戶ID';
comment on column public.follows.created_at is '關注時間';

-- 創建索引以提高查詢效率
create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists follows_following_id_idx on public.follows(following_id);

-- 設置 RLS 策略
alter table public.follows enable row level security;

-- 刪除可能存在的舊策略
drop policy if exists "任何人都可以查看關注關係" on public.follows;
drop policy if exists "已登入用戶可以添加關注" on public.follows;
drop policy if exists "已登入用戶可以取消關注" on public.follows;

-- 允許已登入用戶查看關注關係
create policy "任何人都可以查看關注關係"
  on public.follows for select
  using (true);

-- 允許已登入用戶添加關注
create policy "已登入用戶可以添加關注"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

-- 允許已登入用戶取消關注
create policy "已登入用戶可以取消關注"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- 授予訪問權限
grant all on public.follows to postgres, service_role;
grant select, insert, delete on public.follows to authenticated; 