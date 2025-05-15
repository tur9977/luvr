import { supabase } from '../client'
import { Event, Post, NewEvent, NewPost, UpdateEvent, EventParticipant, NewEventParticipant } from '@/lib/types/database.types'
import { logger } from './logger'

interface CreateEventWithPostParams {
  event: NewEvent;
  post: NewPost;
}

interface CreateEventWithPostResult {
  event: Event;
  post: Post;
}

export async function createEventWithPost(
  userId: string,
  params: CreateEventWithPostParams
): Promise<CreateEventWithPostResult> {
  try {
    logger.info('Creating event with post', { userId, params })

    const { data, error } = await supabase.rpc('create_event_with_post', {
      p_user_id: userId,
      p_event: params.event,
      p_post: params.post,
    })

    if (error) {
      logger.error('Error creating event with post', { error })
      throw error
    }

    logger.info('Successfully created event with post', { data })
    return data
  } catch (error) {
    logger.error('Error in createEventWithPost', { error })
    throw error
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    logger.info('Getting event by id', { id })

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error getting event by id', { error })
      throw error
    }

    logger.info('Successfully got event by id', { data })
    return data
  } catch (error) {
    logger.error('Error in getEventById', { error })
    throw error
  }
}

export async function updateEvent(
  id: string,
  updates: Partial<Event>,
  userId: string
): Promise<Event> {
  try {
    logger.info('Updating event', { id, updates, userId })

    // 先獲取事件以檢查權限
    const { data: event, error: getError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (getError) {
      logger.error('Error getting event for update', { getError })
      throw getError
    }

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.creator_id !== userId) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating event', { error })
      throw error
    }

    logger.info('Successfully updated event', { data })
    return data
  } catch (error) {
    logger.error('Error in updateEvent', { error })
    throw error
  }
}

export async function deleteEvent(id: string, userId: string): Promise<void> {
  try {
    logger.info('Deleting event', { id, userId })

    // 先獲取事件以檢查權限
    const { data: event, error: getError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (getError) {
      logger.error('Error getting event for delete', { getError })
      throw getError
    }

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.creator_id !== userId) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting event', { error })
      throw error
    }

    logger.info('Successfully deleted event', { id })
  } catch (error) {
    logger.error('Error in deleteEvent', { error })
    throw error
  }
}

export class EventService {
  private static instance: EventService

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  async joinEvent(eventId: string, userId: string, status: 'going' | 'interested' | 'not_going' = 'going'): Promise<EventParticipant> {
    try {
      logger.info('Joining event', { eventId, userId, status })

      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status,
          payment_status: 'pending'
        })
        .select()
        .single()

      if (error) {
        logger.error('Error joining event', { error })
        throw error
      }

      // 更新參與者計數
      await this.updateParticipantCount(eventId)

      logger.info('Successfully joined event', { data })
      return data
    } catch (error) {
      logger.error('Failed to join event', { error })
      throw error
    }
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    try {
      logger.info('Leaving event', { eventId, userId })

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (error) {
        logger.error('Error leaving event', { error })
        throw error
      }

      // 更新參與者計數
      await this.updateParticipantCount(eventId)

      logger.info('Successfully left event', { eventId, userId })
    } catch (error) {
      logger.error('Failed to leave event', { error })
      throw error
    }
  }

  private async updateParticipantCount(eventId: string): Promise<void> {
    try {
      logger.info('Updating participant count', { eventId })

      const { data, error } = await supabase
        .from('event_participants')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId)
        .eq('status', 'going')

      if (error) {
        logger.error('Error counting participants', { error })
        throw error
      }

      const count = data?.length || 0

      const { error: updateError } = await supabase
        .from('events')
        .update({ participants_count: count })
        .eq('id', eventId)

      if (updateError) {
        logger.error('Error updating participant count', { updateError })
        throw updateError
      }

      logger.info('Successfully updated participant count', { eventId, count })
    } catch (error) {
      logger.error('Failed to update participant count', { error })
      throw error
    }
  }
} 