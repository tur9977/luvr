import { supabase } from './supabase/client'
import { requestNotificationPermission } from './firebase'

interface NotificationPreferences {
  email: boolean
  push: boolean
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences,
      })
      .eq('id', userId)

    if (error) throw error

    if (preferences.push) {
      const token = await requestNotificationPermission()
      if (token) {
        await supabase
          .from('push_tokens')
          .upsert({
            user_id: userId,
            token,
            created_at: new Date().toISOString(),
          })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return { success: false, error }
  }
}

export async function sendEventNotification(
  eventId: string,
  userId: string,
  title: string,
  message: string
) {
  try {
    // 獲取用戶的通知偏好設置
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, notification_preferences')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const preferences = profile.notification_preferences as NotificationPreferences

    // 發送電子郵件通知
    if (preferences.email) {
      await supabase.functions.invoke('send-email', {
        body: {
          to: profile.email,
          subject: title,
          text: message,
        },
      })
    }

    // 發送推送通知
    if (preferences.push) {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)

      if (tokens && tokens.length > 0) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            tokens: tokens.map(t => t.token),
            title,
            message,
            data: {
              eventId,
              type: 'event_reminder',
            },
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error }
  }
} 