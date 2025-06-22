import { NextRequest, NextResponse } from 'next/server'
import { ChatSessionManager } from '@/lib/chat/session-manager'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // Get user's chat sessions
    const sessions = await sessionManager.getUserSessions(
      user.id,
      documentId || undefined,
      limit
    )

    // Get message counts and last message for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        try {
          // Get all messages to count them and get the last message
          const allMessages = await sessionManager.getSessionMessages(session.id, 1000)
          const messageCount = allMessages.length
          
          // Get the most recent message (last in the array since they're ordered by sequence_number)
          const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null
          
          return {
            id: session.id,
            documentId: session.documentId,
            title: session.title,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            lastMessageAt: session.lastMessageAt.toISOString(),
            messageCount,
            lastMessage: lastMessage ? {
              type: lastMessage.messageType,
              content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
              createdAt: lastMessage.createdAt.toISOString()
            } : null
          }
        } catch (error) {
          console.error(`Error getting messages for session ${session.id}:`, error)
          return {
            id: session.id,
            documentId: session.documentId,
            title: session.title,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            lastMessageAt: session.lastMessageAt.toISOString(),
            messageCount: 0,
            lastMessage: null
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCounts
    })

  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
} 