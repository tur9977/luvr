import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createEvent, getEventsByStatus } from '@/lib/supabase/services/eventService'
import type { NewEvent } from '@/lib/types/database.types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const events = await getEventsByStatus(status)
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event: NewEvent = await request.json()
    event.creator_id = session.user.id

    const newEvent = await createEvent(event)
    return NextResponse.json(newEvent)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 