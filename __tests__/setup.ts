import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

// 創建測試用的 Supabase 客戶端
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 測試用戶數據
export const testUser = {
  id: 'fa41581d-a7bb-4f51-9395-81994d4b5aa4',
  email: 'test@example.com',
};

// 測試事件數據
export const testEvent = {
  title: 'Test Event',
  description: 'This is a test event',
  date: new Date(Date.now() + 86400000).toISOString(), // 明天
  location: 'Test Location',
  creator_id: testUser.id,
  event_type: 'social' as const,
  status: 'upcoming' as const,
  price: 100,
  currency: 'TWD',
  max_participants: 10,
  registration_deadline: new Date(Date.now() + 43200000).toISOString(), // 12小時後
};

// 測試帖子數據
export const testPost = {
  caption: 'This is a test post',
  user_id: testUser.id,
  status: 'active' as const,
  visibility: 'public' as const,
};

// 清理測試數據的函數
export async function cleanupTestData() {
  const { error: postsError } = await supabase
    .from('posts')
    .delete()
    .eq('user_id', testUser.id);

  const { error: eventsError } = await supabase
    .from('events')
    .delete()
    .eq('creator_id', testUser.id);

  if (postsError) console.error('Error cleaning up posts:', postsError);
  if (eventsError) console.error('Error cleaning up events:', eventsError);
} 