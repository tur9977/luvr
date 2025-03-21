-- Create post_media table
CREATE TABLE IF NOT EXISTS post_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    aspect_ratio DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    duration DOUBLE PRECISION,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_order ON post_media("order");

-- Add RLS policies
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON post_media
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own post media
CREATE POLICY "Allow authenticated users to insert their own post media" ON post_media
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_media.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Allow users to update their own post media
CREATE POLICY "Allow users to update their own post media" ON post_media
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_media.post_id
            AND posts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_media.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Allow users to delete their own post media
CREATE POLICY "Allow users to delete their own post media" ON post_media
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_media.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_post_media_updated_at
    BEFORE UPDATE ON post_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update database types
ALTER TYPE public.json_build_object ADD ATTRIBUTE IF NOT EXISTS post_media jsonb; 