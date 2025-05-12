import { Post, Profile, PostMedia } from '../types/database.types'
import { logger } from './logger'

export class DatabaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseValidationError'
  }
}

export const validatePost = (post: Partial<Post>): void => {
  if (!post) {
    throw new DatabaseValidationError('Post object is required')
  }

  if (post.user_id && typeof post.user_id !== 'string') {
    throw new DatabaseValidationError('Invalid user_id format')
  }

  if (post.media_urls && !Array.isArray(post.media_urls)) {
    throw new DatabaseValidationError('media_urls must be an array')
  }

  logger.info('Post validation successful', { postId: post.id })
}

export const validateProfile = (profile: Partial<Profile>): void => {
  if (!profile) {
    throw new DatabaseValidationError('Profile object is required')
  }

  if (profile.username && typeof profile.username !== 'string') {
    throw new DatabaseValidationError('Invalid username format')
  }

  if (profile.role && !['user', 'admin', 'banned'].includes(profile.role)) {
    throw new DatabaseValidationError('Invalid role value')
  }

  logger.info('Profile validation successful', { profileId: profile.id })
}

export const validatePostMedia = (media: Partial<PostMedia>): void => {
  if (!media) {
    throw new DatabaseValidationError('Media object is required')
  }

  if (media.media_type && !['image', 'video'].includes(media.media_type)) {
    throw new DatabaseValidationError('Invalid media_type')
  }

  if (media.aspect_ratio && typeof media.aspect_ratio !== 'number') {
    throw new DatabaseValidationError('Invalid aspect_ratio format')
  }

  logger.info('Media validation successful', { mediaId: media.id })
}

export const sanitizeDatabaseInput = <T extends Record<string, any>>(input: T): T => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = value
    }
  }

  return sanitized as T
} 