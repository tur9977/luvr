const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate() {
  try {
    // 創建 posts 表
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT,
          event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- 創建 RLS 策略
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all posts"
          ON public.posts FOR SELECT
          USING (true);

        CREATE POLICY "Users can create their own posts"
          ON public.posts FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own posts"
          ON public.posts FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own posts"
          ON public.posts FOR DELETE
          USING (auth.uid() = user_id);
      `
    })

    if (postsError) throw postsError

    // 創建 events 表
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          location TEXT,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
          category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('party', 'meetup', 'online', 'other')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- 創建 RLS 策略
        ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all events"
          ON public.events FOR SELECT
          USING (true);

        CREATE POLICY "Users can create events"
          ON public.events FOR INSERT
          WITH CHECK (auth.uid() = creator_id);

        CREATE POLICY "Users can update their own events"
          ON public.events FOR UPDATE
          USING (auth.uid() = creator_id);

        CREATE POLICY "Users can delete their own events"
          ON public.events FOR DELETE
          USING (auth.uid() = creator_id);
      `
    })

    if (eventsError) throw eventsError

    // 創建 event_participants 表
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.event_participants (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
          payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(event_id, user_id)
        );

        -- 創建 RLS 策略
        ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all participants"
          ON public.event_participants FOR SELECT
          USING (true);

        CREATE POLICY "Users can manage their own participation"
          ON public.event_participants FOR ALL
          USING (auth.uid() = user_id);

        CREATE POLICY "Event creators can manage participants"
          ON public.event_participants FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.events
              WHERE id = event_participants.event_id
              AND creator_id = auth.uid()
            )
          );
      `
    })

    if (participantsError) throw participantsError

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate() 