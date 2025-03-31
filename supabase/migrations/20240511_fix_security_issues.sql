-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move moddatetime extension to extensions schema
DROP EXTENSION IF EXISTS moddatetime;
CREATE EXTENSION moddatetime SCHEMA extensions;

-- Drop existing views
DROP VIEW IF EXISTS public.user_activity_summary;
DROP VIEW IF EXISTS public.pending_reports;
DROP VIEW IF EXISTS public.event_summary;

-- Recreate user_activity_summary with limited information
CREATE VIEW public.user_activity_summary AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.updated_at,
    COUNT(DISTINCT posts.id) as post_count,
    COUNT(DISTINCT e.id) as event_count,
    COUNT(DISTINCT f.follower_id) as follower_count
FROM public.profiles p
LEFT JOIN public.posts ON posts.user_id = p.id
LEFT JOIN public.events e ON e.user_id = p.id
LEFT JOIN public.follows f ON f.following_id = p.id
GROUP BY p.id, p.username, p.avatar_url, p.updated_at;

-- Add RLS policy to user_activity_summary
ALTER VIEW public.user_activity_summary OWNER TO authenticated;
GRANT SELECT ON public.user_activity_summary TO authenticated;
GRANT SELECT ON public.user_activity_summary TO anon;

-- Recreate pending_reports
CREATE VIEW public.pending_reports AS
SELECT 
    r.id,
    r.report_type,
    r.reported_id,
    r.reporter_id,
    r.reason,
    r.status,
    r.created_at,
    r.updated_at,
    p.username as reporter_username,
    CASE 
        WHEN r.report_type = 'post' THEN posts.content
        WHEN r.report_type = 'event' THEN events.title
        WHEN r.report_type = 'user' THEN reported_user.username
    END as reported_content
FROM public.reports r
LEFT JOIN public.profiles p ON p.id = r.reporter_id
LEFT JOIN public.posts ON posts.id = r.reported_id AND r.report_type = 'post'
LEFT JOIN public.events ON events.id = r.reported_id AND r.report_type = 'event'
LEFT JOIN public.profiles reported_user ON reported_user.id = r.reported_id AND r.report_type = 'user'
WHERE r.status = 'pending';

-- Add RLS policy to pending_reports
ALTER VIEW public.pending_reports OWNER TO authenticated;
GRANT SELECT ON public.pending_reports TO authenticated;

-- Create RLS policy for reports table
CREATE POLICY "Only admins can view reports" ON public.reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Recreate event_summary
CREATE VIEW public.event_summary AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.location,
    e.status,
    e.user_id,
    p.username as creator_username,
    p.avatar_url as creator_avatar,
    COUNT(DISTINCT ep.user_id) FILTER (WHERE ep.status = 'going') as going_count,
    COUNT(DISTINCT ep.user_id) FILTER (WHERE ep.status = 'interested') as interested_count
FROM public.events e
LEFT JOIN public.profiles p ON p.id = e.user_id
LEFT JOIN public.event_participants ep ON ep.event_id = e.id
GROUP BY e.id, e.title, e.description, e.date, e.location, e.status, e.user_id, p.username, p.avatar_url;

-- Add RLS policy to event_summary
ALTER VIEW public.event_summary OWNER TO authenticated;
GRANT SELECT ON public.event_summary TO authenticated;
GRANT SELECT ON public.event_summary TO anon;

-- Create RLS policy for events table
CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT
    TO public
    USING (true);

-- Create RLS policy for event_participants table
CREATE POLICY "Event participants are viewable by everyone" ON public.event_participants
    FOR SELECT
    TO public
    USING (true);

-- Fix function search paths
DO $$ 
DECLARE 
    func record;
BEGIN
    FOR func IN 
        SELECT proname, pronamespace::regnamespace as schema
        FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I() SET search_path = public, pg_temp', func.schema, func.proname);
    END LOOP;
END $$;

-- Notify about the changes
NOTIFY pgrst, 'reload schema'; 