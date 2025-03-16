-- 添加通知偏好設置到用戶檔案
alter table public.profiles
add column if not exists notification_preferences jsonb default '{"email": true, "push": false}'::jsonb,
add column if not exists email text;

-- 創建推送通知令牌表
create table if not exists public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, token)
);

-- Enable RLS
alter table public.push_tokens enable row level security;

-- Create updated_at trigger
create trigger handle_updated_at before update on public.push_tokens
  for each row execute procedure moddatetime (updated_at);

-- Create policies
create policy "Users can view their own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);
create index if not exists push_tokens_token_idx on public.push_tokens(token);

-- Grant access
grant all on public.push_tokens to authenticated;
grant all on public.push_tokens to service_role; 