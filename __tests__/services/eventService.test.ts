import { supabase } from '../../lib/supabase/client';
import { testUser, testEvent, testPost, cleanupTestData } from '../setup';
import { createEventWithPost, getEventById, updateEvent, deleteEvent } from '../../lib/supabase/services/eventService';
import { Event, Post } from '../../lib/types/database.types';
import { logger } from '../../lib/supabase/services/logger';

// 模擬 Supabase 客戶端
jest.mock('../../lib/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

// 模擬 logger
jest.mock('../../lib/supabase/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Event Service', () => {
  const mockEvent: Event = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    date: new Date().toISOString(),
    location: 'Test Location',
    image_url: null,
    creator_id: testUser.id,
    created_at: new Date().toISOString(),
    cover_url: null,
    updated_at: new Date().toISOString(),
    event_type: 'social',
    participants_count: 0,
    comments_count: 0,
    photos_count: 0,
    status: 'upcoming',
    max_participants: 100,
    registration_deadline: new Date().toISOString(),
    price: 0,
    currency: 'USD',
    tags: [],
    metadata: {},
    category: null,
    participants: null,
    cover_image: null
  };

  const mockPost: Post = {
    id: 'test-post-id',
    user_id: testUser.id,
    content: 'Test Post',
    event_id: mockEvent.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEventWithPost', () => {
    it('should create an event with a post', async () => {
      // 設置 mock 返回值
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: { event: mockEvent, post: mockPost },
        error: null
      });

      const result = await createEventWithPost(testUser.id, {
        event: testEvent,
        post: testPost
      });

      expect(result).toEqual({ event: mockEvent, post: mockPost });
      expect(supabase.rpc).toHaveBeenCalledWith('create_event_with_post', {
        p_user_id: testUser.id,
        p_event: testEvent,
        p_post: testPost
      });
    });

    it('should handle validation errors', async () => {
      // 設置 mock 返回值為錯誤
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid input' }
      });

      const invalidEvent = { ...testEvent, title: '' };

      await expect(createEventWithPost(testUser.id, {
        event: invalidEvent,
        post: testPost
      })).rejects.toMatchObject({ message: 'Invalid input' });

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle Supabase network error', async () => {
      (supabase.rpc as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(createEventWithPost(testUser.id, {
        event: testEvent,
        post: testPost
      })).rejects.toThrow('Network error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw Unauthorized if userId is invalid', async () => {
      // 模擬 Supabase 返回 Unauthorized 錯誤
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized' }
      });

      await expect(createEventWithPost('', {
        event: testEvent,
        post: testPost
      })).rejects.toMatchObject({ message: 'Unauthorized' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getEventById', () => {
    it('should retrieve an event by id', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: mockEvent,
            error: null
          })
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getEventById(mockEvent.id);

      expect(result).toEqual(mockEvent);
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return null for non-existent event', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null
          })
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getEventById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle Supabase error', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' }
          })
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect });
      await expect(getEventById(mockEvent.id)).rejects.toMatchObject({ message: 'Database error' });
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: mockEvent,
            error: null
          })
        }))
      }));
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValueOnce({
              data: { ...mockEvent, ...updates },
              error: null
            })
          }))
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

      const result = await updateEvent(mockEvent.id, updates, testUser.id);

      expect(result).toEqual({ ...mockEvent, ...updates });
      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
    });

    it('should throw Unauthorized error when user is not the creator', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: { ...mockEvent, creator_id: 'different-user-id' },
            error: null
          })
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(updateEvent(mockEvent.id, updates, testUser.id))
        .rejects.toMatchObject({ message: 'Unauthorized' });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const updates = { price: -100 };
      
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: mockEvent,
            error: null
          })
        }))
      }));
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Invalid input' }
            })
          }))
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

      await expect(updateEvent(mockEvent.id, updates, testUser.id))
        .rejects.toMatchObject({ message: 'Invalid input' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: mockEvent,
            error: null
          })
        }))
      }));
      const mockDelete = jest.fn(() => ({
        eq: jest.fn().mockResolvedValueOnce({
          error: null
        })
      }));
      mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete });

      await deleteEvent(mockEvent.id, testUser.id);

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw Unauthorized error when user is not the creator', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: { ...mockEvent, creator_id: 'different-user-id' },
            error: null
          })
        }))
      }));
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(deleteEvent(mockEvent.id, testUser.id))
        .rejects.toMatchObject({ message: 'Unauthorized' });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle delete failure', async () => {
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValueOnce({
            data: mockEvent,
            error: null
          })
        }))
      }));
      const mockDelete = jest.fn(() => ({
        eq: jest.fn().mockResolvedValueOnce({
          error: { message: 'Foreign key violation' }
        })
      }));
      mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete });

      await expect(deleteEvent(mockEvent.id, testUser.id))
        .rejects.toMatchObject({ message: 'Foreign key violation' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 