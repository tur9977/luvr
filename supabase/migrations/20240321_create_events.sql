-- 檢查表是否存在，如果不存在則創建
do $$ 
begin
  -- 檢查 events 表
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'events') then
    -- 創建活動表
    create table public.events (
      id uuid default gen_random_uuid() primary key,
      title text not null,
      description text,
      date timestamp with time zone not null,
      location text,
      cover_url text,
      user_id uuid not null references public.profiles(id) on delete cascade,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
  else
    -- 檢查並添加缺失的列
    if not exists (
      select from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'events' 
      and column_name = 'cover_url'
    ) then
      alter table public.events add column cover_url text;
    end if;

    if not exists (
      select from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'events' 
      and column_name = 'updated_at'
    ) then
      alter table public.events add column updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
    end if;
  end if;

  -- 檢查 event_participants 表
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'event_participants') then
    create table public.event_participants (
      event_id uuid not null references public.events(id) on delete cascade,
      user_id uuid not null references public.profiles(id) on delete cascade,
      status text not null check (status in ('going', 'interested', 'not_going')),
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      primary key (event_id, user_id)
    );
  end if;
end $$;

-- 為活動表添加註釋
comment on table public.events is '活動表';
comment on column public.events.id is '活動ID';
comment on column public.events.title is '活動標題';
comment on column public.events.description is '活動描述';
comment on column public.events.date is '活動日期';
comment on column public.events.location is '活動地點';
comment on column public.events.cover_url is '活動封面圖片URL';
comment on column public.events.user_id is '創建者ID';
comment on column public.events.created_at is '創建時間';
comment on column public.events.updated_at is '更新時間';

-- 為活動參與者表添加註釋
comment on table public.event_participants is '活動參與者表';
comment on column public.event_participants.event_id is '活動ID';
comment on column public.event_participants.user_id is '用戶ID';
comment on column public.event_participants.status is '參與狀態（going=參加, interested=感興趣, not_going=不參加）';
comment on column public.event_participants.created_at is '創建時間';

-- 創建索引以提高查詢效率
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_date_idx on public.events(date);
create index if not exists event_participants_event_id_idx on public.event_participants(event_id);
create index if not exists event_participants_user_id_idx on public.event_participants(user_id);

-- 設置 RLS 策略
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- 刪除可能存在的舊策略
drop policy if exists "任何人都可以查看活動" on public.events;
drop policy if exists "已登入用戶可以創建活動" on public.events;
drop policy if exists "創建者可以更新活動" on public.events;
drop policy if exists "創建者可以刪除活動" on public.events;
drop policy if exists "任何人都可以查看活動參與狀態" on public.event_participants;
drop policy if exists "已登入用戶可以更新自己的參與狀態" on public.event_participants;

-- 活動表的策略
create policy "任何人都可以查看活動"
  on public.events for select
  using (true);

create policy "已登入用戶可以創建活動"
  on public.events for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "創建者可以更新活動"
  on public.events for update
  to authenticated
  using (auth.uid() = user_id);

create policy "創建者可以刪除活動"
  on public.events for delete
  to authenticated
  using (auth.uid() = user_id);

-- 活動參與者表的策略
create policy "任何人都可以查看活動參與狀態"
  on public.event_participants for select
  using (true);

create policy "已登入用戶可以更新自己的參與狀態"
  on public.event_participants for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 授予訪問權限
grant all on public.events to postgres, service_role;
grant all on public.event_participants to postgres, service_role;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_participants to authenticated; 