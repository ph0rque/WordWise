import { NextRequest, NextResponse } from 'next/server'
import { ChatSessionManager } from '@/lib/chat/session-manager'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Initialize session manager with the supabase client
    const sessionManager = new ChatSessionManager(supabase)

    // Export the session (includes session details and all messages)
    const { session, messages } = await sessionManager.exportSession(sessionId)

    // Verify the session belongs to the current user
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Convert stored messages to chat message format for display
    const chatMessages = messages.map(msg => sessionManager.storedMessageToChatMessage(msg))

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        documentId: session.documentId,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        lastMessageAt: session.lastMessageAt.toISOString(),
        isActive: session.isActive
      },
      messages: chatMessages
    })

  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
} 