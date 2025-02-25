'use client'

import { useEffect, useState } from 'react'
import { Message, Profile } from '@/types/database'
import { api } from '@/lib/api'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<{
    [key: string]: { profile: Profile; lastMessage: Message }
  }>({})

  useEffect(() => {
    // 獲取所有對話
    // 實現即時更新等功能
  }, [])

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">私訊</h1>
      {/* 實現對話列表和對話界面 */}
    </div>
  )
} 