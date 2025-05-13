import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createEvent, getEventsByStatus } from '@/lib/supabase/services/eventService'
import { errorHandler } from '@/lib/middleware/error'
import type { NewEvent } from '@/lib/types/database.types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const events = await getEventsByStatus(status)
    return NextResponse.json(events)
  } catch (error) {
    return errorHandler(error as Error, request, new Response())
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
    return errorHandler(error as Error, request, new Response())
  }
} 