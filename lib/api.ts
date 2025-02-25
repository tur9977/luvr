import { supabase } from './supabase'

export const api = {
  // 認證相關
  auth: {
    signUp: async (email: string, password: string) => {
      return await supabase.auth.signUp({ email, password })
    },
    signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({ email, password })
    },
    signOut: async () => {
      return await supabase.auth.signOut()
    }
  },

  // 私訊相關
  messages: {
    send: async (receiverId: string, content: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      return await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content
        })
    },

    getConversation: async (otherUserId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      return await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
        .order('created_at', { ascending: true })
    }
  }
} 