-- First, drop the dependent policies
drop policy if exists "Admins can view all reports" on public.reports;
drop policy if exists "Enable admin access" on public.reports;
drop policy if exists "Only admins can update reports" on public.reports;
drop policy if exists "admin_all_access" on public.reports;

-- Drop the existing role check constraint if it exists
alter table public.profiles drop constraint if exists profiles_role_check;

-- Update the role column to support new role types
alter table public.profiles 
drop column if exists role cascade;

alter table public.profiles
add column role text not null default 'normal_user' 
check (role in ('normal_user', 'banned_user', 'verified_user', 'brand_user', 'admin'));

-- Create or replace the function to handle new user creation with default role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    'normal_user'  -- Set default role for new users
  );
  return new;
end;
$$ language plpgsql security definer;

-- Update existing users to have the normal_user role if they don't have a role
update public.profiles
set role = 'normal_user'
where role is null;

-- Create or replace function to update user role (admin only)
create or replace function public.admin_update_user_role(
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if the executing user is an admin
  if not exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  ) then
    raise exception 'Only administrators can update user roles';
  end if;

  -- Check if the new role is valid
  if new_role not in ('normal_user', 'banned_user', 'verified_user', 'brand_user', 'admin') then
    raise exception 'Invalid role specified';
  end if;

  -- Update the user's role
  update profiles
  set role = new_role
  where id = target_user_id;
end;
$$;

-- Recreate the policies with new role values
create policy "Admins can view all reports" on public.reports
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Enable admin access" on public.reports
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can update reports" on public.reports
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin_all_access" on public.reports
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  ); 