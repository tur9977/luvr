import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPost, getPostsByEventId } from '@/lib/supabase/services/postService'
import type { NewPost } from '@/lib/types/database.types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (eventId) {
      const posts = await getPostsByEventId(eventId)
      return NextResponse.json(posts)
    }

    return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post: NewPost = await request.json()
    post.user_id = session.user.id

    const newPost = await createPost(post)
    return NextResponse.json(newPost)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 