const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate() {
  try {
    // 1. 創建 posts 表（如果不存在）
    const { error: createPostsError } = await supabase.rpc('create_posts_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          event_id UUID REFERENCES events(id) ON DELETE SET NULL,
          media_urls TEXT[] DEFAULT '{}',
          media_type TEXT CHECK (media_type IN ('image', 'video')),
          thumbnail_url TEXT,
          aspect_ratio NUMERIC DEFAULT 1,
          duration INTEGER,
          caption TEXT,
          location TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 創建 RLS 策略
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all posts"
          ON posts FOR SELECT
          USING (true);

        CREATE POLICY "Users can create their own posts"
          ON posts FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own posts"
          ON posts FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own posts"
          ON posts FOR DELETE
          USING (auth.uid() = user_id);
      `
    })

    if (createPostsError) throw createPostsError

    // 2. 創建 events 表（如果不存在）
    const { error: createEventsError } = await supabase.rpc('create_events_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          location TEXT,
          status TEXT CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'draft',
          event_type TEXT,
          max_participants INTEGER,
          registration_deadline TIMESTAMP WITH TIME ZONE,
          price NUMERIC,
          currency TEXT,
          tags TEXT[],
          metadata JSONB,
          cover_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 創建 RLS 策略
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all events"
          ON events FOR SELECT
          USING (true);

        CREATE POLICY "Users can create events"
          ON events FOR INSERT
          WITH CHECK (auth.uid() = creator_id);

        CREATE POLICY "Users can update their own events"
          ON events FOR UPDATE
          USING (auth.uid() = creator_id);

        CREATE POLICY "Users can delete their own events"
          ON events FOR DELETE
          USING (auth.uid() = creator_id);
      `
    })

    if (createEventsError) throw createEventsError

    // 3. 創建 event_participants 表
    const { error: createParticipantsError } = await supabase.rpc('create_event_participants_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS event_participants (
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT CHECK (status IN ('going', 'interested', 'not_going')) DEFAULT 'going',
          payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
          payment_details JSONB,
          check_in_time TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (event_id, user_id)
        );

        -- 創建 RLS 策略
        ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all participants"
          ON event_participants FOR SELECT
          USING (true);

        CREATE POLICY "Users can manage their own participation"
          ON event_participants FOR ALL
          USING (auth.uid() = user_id);
      `
    })

    if (createParticipantsError) throw createParticipantsError

    // 4. 創建索引
    const { error: createIndexesError } = await supabase.rpc('create_indexes', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_event_id ON posts(event_id);
        CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
        CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);
        CREATE INDEX IF NOT EXISTS idx_event_participants_payment_status ON event_participants(payment_status);
      `
    })

    if (createIndexesError) throw createIndexesError

    // 5. 創建觸發器
    const { error: createTriggersError } = await supabase.rpc('create_triggers', {
      sql: `
        -- 更新 updated_at 的觸發器函數
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- 為 posts 表添加觸發器
        DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
        CREATE TRIGGER update_posts_updated_at
          BEFORE UPDATE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        -- 為 events 表添加觸發器
        DROP TRIGGER IF EXISTS update_events_updated_at ON events;
        CREATE TRIGGER update_events_updated_at
          BEFORE UPDATE ON events
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    })

    if (createTriggersError) throw createTriggersError

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate() 