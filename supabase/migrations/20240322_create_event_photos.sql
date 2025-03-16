-- Create event_photos table
create table if not exists public.event_photos (
    id uuid default gen_random_uuid() primary key,
    event_id uuid not null references public.events(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    photo_url text not null,
    caption text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.event_photos enable row level security;

-- Drop existing trigger if exists
drop trigger if exists handle_updated_at on public.event_photos;

-- Create updated_at trigger
create trigger handle_updated_at
    before update on public.event_photos
    for each row
    execute procedure moddatetime (updated_at);

-- Drop existing policies if exist
drop policy if exists "Users can view all photos" on public.event_photos;
drop policy if exists "Authenticated users can insert photos" on public.event_photos;
drop policy if exists "Users can update their own photos" on public.event_photos;
drop policy if exists "Users can delete their own photos" on public.event_photos;

-- Create policies
create policy "Users can view all photos"
    on public.event_photos for select
    using (true);

create policy "Authenticated users can insert photos"
    on public.event_photos for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own photos"
    on public.event_photos for update
    using (auth.uid() = user_id);

create policy "Users can delete their own photos"
    on public.event_photos for delete
    using (auth.uid() = user_id);

-- Create indexes
create index if not exists event_photos_event_id_idx on public.event_photos(event_id);
create index if not exists event_photos_user_id_idx on public.event_photos(user_id);
create index if not exists event_photos_created_at_idx on public.event_photos(created_at);

-- Grant access
grant all on public.event_photos to authenticated;
grant all on public.event_photos to service_role; 