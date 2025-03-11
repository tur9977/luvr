-- Create contents table
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Create policies for contents table
CREATE POLICY "Enable read access for all users" ON public.contents
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Enable insert access for authenticated users" ON public.contents
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for content owners" ON public.contents
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (status = 'pending');

CREATE POLICY "Enable full access for admin users" ON public.contents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON public.contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX contents_user_id_idx ON public.contents(user_id);
CREATE INDEX contents_status_idx ON public.contents(status);
CREATE INDEX contents_created_at_idx ON public.contents(created_at DESC); 