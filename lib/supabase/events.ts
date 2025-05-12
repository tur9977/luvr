import { createClient } from '@supabase/supabase-js'
import { Event, NewEvent, UpdateEvent, EventWithProfile } from '../types/database.types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getEvents(page = 1, limit = 10): Promise<EventWithProfile[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles:creator_id (id, username, avatar_url),
      event_participants (user_id)
    `)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error
  return data || []
}

export async function getEventById(id: string): Promise<EventWithProfile | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles:creator_id (id, username, avatar_url),
      event_participants (user_id)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createEvent(event: NewEvent): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id: string, event: UpdateEvent): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function joinEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, user_id: userId })

  if (error) throw error

  // 更新活動參與人數
  await supabase.rpc('increment_event_participants', { event_id: eventId })
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw error

  // 更新活動參與人數
  await supabase.rpc('decrement_event_participants', { event_id: eventId })
}

export async function getEventParticipants(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('user_id')
    .eq('event_id', eventId)

  if (error) throw error
  return data.map(p => p.user_id)
} 