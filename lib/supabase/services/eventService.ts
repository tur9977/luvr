import { createClient } from '@supabase/supabase-js'
import type { Event, NewEvent, UpdateEvent } from '@/lib/types/database.types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function validateEventData(event: NewEvent) {
  // 檢查創建者是否存在
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', event.creator_id)
    .single()

  if (creatorError || !creator) {
    throw new Error('Invalid creator_id')
  }

  return true
}

export async function createEvent(event: NewEvent) {
  await validateEventData(event)

  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id: string, event: UpdateEvent) {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles:creator_id (
        id,
        username,
        avatar_url
      ),
      event_participants (
        user_id,
        status,
        payment_status
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getEventsByStatus(status: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles:creator_id (
        id,
        username,
        avatar_url
      ),
      event_participants (
        user_id,
        status,
        payment_status
      )
    `)
    .eq('status', status)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function updateEventParticipant(
  eventId: string,
  userId: string,
  status: 'going' | 'interested' | 'not_going'
) {
  const { data, error } = await supabase
    .from('event_participants')
    .upsert({
      event_id: eventId,
      user_id: userId,
      status,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEventParticipants(eventId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('event_id', eventId)

  if (error) throw error
  return data
} 