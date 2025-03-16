-- Drop the existing function if it exists
drop function if exists public.get_users_with_post_counts();

-- Create the updated function
create or replace function public.get_users_with_post_counts()
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz,
  post_count bigint,
  report_count bigint,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.email,
    p.created_at,
    count(distinct posts.id) as post_count,
    count(distinct reports.id) as report_count,
    (
      case 
        when exists (
          select 1 
          from auth.users au 
          where au.id = p.id 
          and au.raw_user_meta_data->>'role' = 'admin'
        ) then 'admin'
        else 'user'
      end
    ) as role
  from profiles p
  left join posts on posts.user_id = p.id
  left join reports on reports.reported_user_id = p.id
  group by p.id, p.username, p.full_name, p.avatar_url, p.email, p.created_at;
end;
$$; 