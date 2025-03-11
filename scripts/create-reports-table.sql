-- Create reports table
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

-- Enable Row Level Security
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

-- Create index for faster queries
CREATE INDEX reports_status_idx ON public.reports(status);
CREATE INDEX reports_created_at_idx ON public.reports(created_at DESC);
CREATE INDEX reports_reported_content_idx ON public.reports(reported_content_id);
CREATE INDEX reports_reported_user_idx ON public.reports(reported_user_id); 