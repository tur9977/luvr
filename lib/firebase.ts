import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

export async function requestNotificationPermission() {
  try {
    if (!messaging) return null

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }
    return null
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

export function onMessageListener() {
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload)
    // 處理收到的推送通知
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || '新通知', {
        body: payload.notification?.body,
      })
    }
  })
} 