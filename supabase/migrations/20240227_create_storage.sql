-- Create a bucket for public assets if it doesn't exist
insert into storage.buckets (id, name, public)
select 'public', 'public', true
where not exists (
    select 1 from storage.buckets where id = 'public'
);

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- Set up security policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'public' );

create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated' AND
    bucket_id = 'public' AND
    (storage.foldername(name))[1] = 'avatars'
  );

create policy "Users can update their own files"
  on storage.objects for update
  using (
    auth.uid() = owner AND
    bucket_id = 'public' AND
    (storage.foldername(name))[1] = 'avatars'
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    auth.uid() = owner AND
    bucket_id = 'public' AND
    (storage.foldername(name))[1] = 'avatars'
  );

-- Create avatars folder if it doesn't exist
insert into storage.objects (bucket_id, name, owner, metadata)
select 'public', 'avatars/.keep', auth.uid(), jsonb_build_object('mimetype', 'text/plain')
where not exists (
    select 1 from storage.objects where bucket_id = 'public' and name = 'avatars/.keep'
); 