-- Create the moddatetime extension if it doesn't exist
create extension if not exists moddatetime;

-- Create the event_comments table
create table if not exists public.event_comments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.event_comments enable row level security;

-- Create updated_at trigger
drop trigger if exists handle_updated_at on public.event_comments;
create trigger handle_updated_at before update on public.event_comments
  for each row execute procedure moddatetime (updated_at);

-- Drop existing policies if they exist
drop policy if exists "Users can view all comments" on public.event_comments;
drop policy if exists "Authenticated users can insert comments" on public.event_comments;
drop policy if exists "Users can update their own comments" on public.event_comments;
drop policy if exists "Users can delete their own comments" on public.event_comments;

-- Create policies
create policy "Users can view all comments" on public.event_comments
  for select using (true);

create policy "Authenticated users can insert comments" on public.event_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own comments" on public.event_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.event_comments
  for delete using (auth.uid() = user_id);

-- Create indexes
create index if not exists event_comments_event_id_idx on public.event_comments(event_id);
create index if not exists event_comments_user_id_idx on public.event_comments(user_id);
create index if not exists event_comments_created_at_idx on public.event_comments(created_at);

-- Grant access
grant all on public.event_comments to authenticated;
grant all on public.event_comments to service_role; 