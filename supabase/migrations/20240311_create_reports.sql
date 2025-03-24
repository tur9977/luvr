-- Add role column to profiles
alter table public.profiles add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- Create reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reported_content_id uuid references public.posts(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolved_by uuid references auth.users(id) on delete set null,
  
  constraint reports_reported_content_id_reporter_id_key unique (reported_content_id, reporter_id)
);

-- Add RLS policies
alter table public.reports enable row level security;

-- 允許所有用戶查看自己的檢舉
create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- 允許管理員查看所有檢舉
create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 允許用戶創建檢舉
create policy "Users can create reports"
  on public.reports for insert
  with check (
    auth.uid() = reporter_id
  );

-- 只允許管理員更新檢舉狀態
create policy "Only admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 添加觸發器函數來更新 resolved_at
create or replace function public.handle_report_status_change()
returns trigger as $$
begin
    if new.status in ('approved', 'rejected') and old.status = 'pending' then
        new.resolved_at = now();
        new.resolved_by = auth.uid();
    end if;
    return new;
end;
$$ language plpgsql;

-- 刪除已存在的觸發器（如果存在）
drop trigger if exists update_report_resolved_at on public.reports;

-- 創建觸發器
create trigger update_report_resolved_at
    before update on public.reports
    for each row
    execute function public.handle_report_status_change();

-- 添加表和欄位的註解
COMMENT ON TABLE public.reports IS '用戶檢舉記錄表';
COMMENT ON COLUMN public.reports.id IS '檢舉記錄 ID';
COMMENT ON COLUMN public.reports.reported_content_id IS '被檢舉的內容 ID';
COMMENT ON COLUMN public.reports.reporter_id IS '檢舉者 ID';
COMMENT ON COLUMN public.reports.reported_user_id IS '被檢舉的用戶 ID';
COMMENT ON COLUMN public.reports.reason IS '檢舉原因';
COMMENT ON COLUMN public.reports.status IS '檢舉狀態：pending（待處理）、approved（已批准）、rejected（已拒絕）';
COMMENT ON COLUMN public.reports.admin_note IS '管理員處理備註';
COMMENT ON COLUMN public.reports.created_at IS '檢舉時間';
COMMENT ON COLUMN public.reports.resolved_at IS '處理時間';
COMMENT ON COLUMN public.reports.resolved_by IS '處理者 ID'; 