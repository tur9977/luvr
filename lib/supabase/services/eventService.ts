import { supabase } from '../client'
import { Event, NewEvent, UpdateEvent, EventParticipant, NewEventParticipant } from '@/lib/types/database.types'
import { logger } from './logger'

export class EventService {
  private static instance: EventService

  private constructor() {}

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  async createEventWithPost(
    userId: string,
    eventData: Omit<NewEvent, 'creator_id' | 'participants_count' | 'comments_count' | 'photos_count' | 'created_at' | 'updated_at'>,
    postContent: string
  ): Promise<{ event: Event; post: any }> {
    try {
      logger.info('Creating event with post', { userId, eventData })

      const { data, error } = await supabase.rpc('create_event_with_post', {
        p_user_id: userId,
        p_title: eventData.title,
        p_description: eventData.description,
        p_date: eventData.date,
        p_location: eventData.location,
        p_status: eventData.status || 'upcoming',
        p_event_type: eventData.event_type || 'other',
        p_post_content: postContent
      })

      if (error) {
        logger.error('Error creating event with post', { error })
        throw error
      }

      logger.info('Successfully created event with post', { data })
      return data
    } catch (error) {
      logger.error('Failed to create event with post', { error })
      throw error
    }
  }

  async getEventById(id: string): Promise<Event | null> {
    try {
      logger.info('Fetching event by ID', { id })

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Error fetching event', { error })
        throw error
      }

      logger.info('Successfully fetched event', { data })
      return data
    } catch (error) {
      logger.error('Failed to fetch event', { error })
      throw error
    }
  }

  async updateEvent(id: string, updates: UpdateEvent): Promise<Event> {
    try {
      logger.info('Updating event', { id, updates })

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
      logger.error('Failed to update event', { error })
      throw error
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      logger.info('Deleting event', { id })

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
      logger.error('Failed to delete event', { error })
      throw error
    }
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