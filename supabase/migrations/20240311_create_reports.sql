-- Add role column to profiles
alter table public.profiles add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- Create reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  
  constraint fk_reports_posts foreign key (post_id) references public.posts(id) on delete cascade,
  constraint fk_reports_profiles foreign key (reporter_id) references public.profiles(id) on delete cascade
);

-- Add RLS policies
alter table public.reports enable row level security;

create policy "Reports are viewable by admins only"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can create reports"
  on public.reports for insert
  with check (
    auth.uid() = reporter_id
  );

create policy "Only admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  ); 