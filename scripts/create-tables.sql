-- First, create the contents table
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for contents
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

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

-- Then, create the reports table
CREATE TABLE IF NOT EXISTS public.reports (
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

-- Enable Row Level Security for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for faster queries
CREATE INDEX contents_user_id_idx ON public.contents(user_id);
CREATE INDEX contents_created_at_idx ON public.contents(created_at DESC);

CREATE INDEX reports_status_idx ON public.reports(status);
CREATE INDEX reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX reports_reported_content_idx ON public.reports(reported_content_id);
CREATE INDEX reports_reported_user_idx ON public.reports(reported_user_id);

-- Add is_banned column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false; 