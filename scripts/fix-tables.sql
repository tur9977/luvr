-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.report_actions CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.contents CASCADE;

-- Create contents table
CREATE TABLE public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for contents
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Create reports table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT status_check CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Create report_actions table to track admin actions
CREATE TABLE public.report_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT action_type_check CHECK (action_type IN ('review', 'resolve', 'dismiss', 'ban_user'))
);

-- Enable RLS for all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for contents table
CREATE POLICY "Enable read access for all users" ON public.contents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.contents
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for content owners" ON public.contents
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for content owners and admins" ON public.contents
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create policies for reports table
CREATE POLICY "Enable insert access for authenticated users" ON public.reports
    FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Enable read access for admin users" ON public.reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create policies for report_actions table
CREATE POLICY "Enable read access for admin users" ON public.report_actions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create indexes for better performance
CREATE INDEX contents_user_id_idx ON public.contents(user_id);
CREATE INDEX contents_created_at_idx ON public.contents(created_at DESC);

CREATE INDEX reports_status_idx ON public.reports(status);
CREATE INDEX reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX reports_reported_content_idx ON public.reports(reported_content_id);
CREATE INDEX reports_reported_user_idx ON public.reports(reported_user_id);

CREATE INDEX report_actions_report_id_idx ON public.report_actions(report_id);
CREATE INDEX report_actions_admin_id_idx ON public.report_actions(admin_id);
CREATE INDEX report_actions_created_at_idx ON public.report_actions(created_at DESC);

-- Add is_banned column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false; 