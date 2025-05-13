import { createClient } from '@supabase/supabase-js'
import type { Event, NewEvent, UpdateEvent } from '@/lib/types/database.types'
import { logError, logInfo, logTransaction } from './logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function validateEventData(event: NewEvent) {
  try {
    // 檢查創建者是否存在
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', event.user_id)
      .single()

    if (creatorError || !creator) {
      throw new Error('Invalid user_id')
    }

    return true
  } catch (error) {
    logError(error as Error, { event })
    throw error
  }
}

export async function createEvent(event: NewEvent) {
  try {
    await validateEventData(event)

    // 使用事務創建活動和相關貼文
    const { data, error } = await supabase.rpc('create_event_with_post', {
      p_user_id: event.user_id,
      p_title: event.title,
      p_description: event.description,
      p_date: event.date,
      p_location: event.location,
      p_status: event.status || 'draft',
      p_category: event.category,
      p_post_content: event.description || `New event: ${event.title}`
    })

    if (error) {
      logError(error, { event })
      throw error
    }

    logTransaction('create_event', { event, result: data })
    return data
  } catch (error) {
    logError(error as Error, { event })
    throw error
  }
}

export async function updateEvent(id: string, event: UpdateEvent) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(event)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError(error, { id, event })
      throw error
    }

    logTransaction('update_event', { id, event, result: data })
    return data
  } catch (error) {
    logError(error as Error, { id, event })
    throw error
  }
}

export async function deleteEvent(id: string) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      logError(error, { id })
      throw error
    }

    logTransaction('delete_event', { id })
  } catch (error) {
    logError(error as Error, { id })
    throw error
  }
}

export async function getEventById(id: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:user_id (
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

    if (error) {
      logError(error, { id })
      throw error
    }

    return data
  } catch (error) {
    logError(error as Error, { id })
    throw error
  }
}

export async function getEventsByStatus(status: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:user_id (
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

    if (error) {
      logError(error, { status })
      throw error
    }

    return data
  } catch (error) {
    logError(error as Error, { status })
    throw error
  }
}

export async function updateEventParticipant(
  eventId: string,
  userId: string,
  status: 'going' | 'interested' | 'not_going'
) {
  try {
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

    if (error) {
      logError(error, { eventId, userId, status })
      throw error
    }

    logTransaction('update_event_participant', { eventId, userId, status, result: data })
    return data
  } catch (error) {
    logError(error as Error, { eventId, userId, status })
    throw error
  }
}

export async function getEventParticipants(eventId: string) {
  try {
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

    if (error) {
      logError(error, { eventId })
      throw error
    }

    return data
  } catch (error) {
    logError(error as Error, { eventId })
    throw error
  }
} 