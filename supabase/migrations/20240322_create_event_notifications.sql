-- Create event notifications table
create table if not exists public.event_notifications (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  remind_before interval not null, -- 提前多久發送提醒
  notification_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id) -- 每個用戶對每個活動只能設置一個提醒
);

-- Enable RLS
alter table public.event_notifications enable row level security;

-- Create updated_at trigger
create trigger handle_updated_at before update on public.event_notifications
  for each row execute procedure moddatetime (updated_at);

-- Create policies
create policy "Users can view their own notifications"
  on public.event_notifications for select
  using (auth.uid() = user_id);

create policy "Users can create their own notifications"
  on public.event_notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.event_notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.event_notifications for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists event_notifications_event_id_idx on public.event_notifications(event_id);
create index if not exists event_notifications_user_id_idx on public.event_notifications(user_id);
create index if not exists event_notifications_notification_sent_idx on public.event_notifications(notification_sent);

-- Grant access
grant all on public.event_notifications to authenticated;
grant all on public.event_notifications to service_role;

-- Create function to check and send notifications
create or replace function check_event_notifications()
returns void
language plpgsql
security definer
as $$
begin
  -- 更新需要發送通知的記錄
  update public.event_notifications
  set notification_sent = true
  where notification_sent = false
  and (
    select e.date
    from public.events e
    where e.id = event_id
  ) - remind_before <= now();
  
  -- 這裡可以添加觸發實際通知的邏輯
  -- 例如：調用外部服務或插入到通知隊列表中
end;
$$; 