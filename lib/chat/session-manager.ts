import { getSupabaseClient } from '@/lib/supabase/client'
import type { ChatMessage, MessageType, MessageStatus } from '@/components/tutor/chat-message'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ChatSession {
  id: string
  userId: string
  documentId: string
  title: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
  isActive: boolean
}

export interface StoredChatMessage {
  id: string
  sessionId: string
  messageType: MessageType
  content: string
  createdAt: Date
  status: MessageStatus
  confidence?: number
  suggestedQuestions?: string[]
  relatedConcepts?: string[]
  feedback?: 'helpful' | 'not_helpful' | null
  feedbackAt?: Date
  sequenceNumber: number
}

interface DatabaseSession {
  id: string
  user_id: string
  document_id: string
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
  is_active: boolean
}

interface DatabaseMessage {
  id: string
  session_id: string
  message_type: MessageType
  content: string
  created_at: string
  status: MessageStatus
  confidence?: number
  suggested_questions?: string[]
  related_concepts?: string[]
  feedback?: 'helpful' | 'not_helpful' | null
  feedback_at?: string
  sequence_number: number
}

export class ChatSessionManager {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getSupabaseClient()
  }

  /**
   * Get or create an active chat session for a document
   */
  async getOrCreateSession(
    userId: string, 
    documentId: string, 
    title?: string
  ): Promise<ChatSession> {
    try {
      // Call the database function to get or create session
      const { data, error } = await this.supabase
        .rpc('get_or_create_chat_session', {
          p_user_id: userId,
          p_document_id: documentId,
          p_title: title || 'AI Tutor Chat'
        })

      if (error) {
        console.error('Error getting/creating chat session:', error)
        throw new Error(`Failed to get or create chat session: ${error.message}`)
      }

      // Fetch the session details
      const { data: session, error: fetchError } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', data)
        .single()

      if (fetchError) {
        console.error('Error fetching chat session:', fetchError)
        throw new Error(`Failed to fetch chat session: ${fetchError.message}`)
      }

      const dbSession = session as DatabaseSession
      return {
        id: dbSession.id,
        userId: dbSession.user_id,
        documentId: dbSession.document_id,
        title: dbSession.title,
        createdAt: new Date(dbSession.created_at),
        updatedAt: new Date(dbSession.updated_at),
        lastMessageAt: new Date(dbSession.last_message_at),
        isActive: dbSession.is_active
      }
    } catch (error) {
      console.error('Error in getOrCreateSession:', error)
      throw error
    }
  }

  /**
   * Get chat sessions for a user
   */
  async getUserSessions(
    userId: string, 
    documentId?: string, 
    limit: number = 10
  ): Promise<ChatSession[]> {
    try {
      let query = this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (documentId) {
        query = query.eq('document_id', documentId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user sessions:', error)
        throw new Error(`Failed to fetch user sessions: ${error.message}`)
      }

      return (data || []).map((session: DatabaseSession) => ({
        id: session.id,
        userId: session.user_id,
        documentId: session.document_id,
        title: session.title,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        lastMessageAt: new Date(session.last_message_at),
        isActive: session.is_active
      }))
    } catch (error) {
      console.error('Error in getUserSessions:', error)
      throw error
    }
  }

  /**
   * Add a message to a chat session
   */
  async addMessage(
    sessionId: string,
    messageType: MessageType,
    content: string,
    options: {
      confidence?: number
      suggestedQuestions?: string[]
      relatedConcepts?: string[]
      status?: MessageStatus
    } = {}
  ): Promise<StoredChatMessage> {
    try {
      const { data, error } = await this.supabase
        .rpc('add_chat_message', {
          p_session_id: sessionId,
          p_message_type: messageType,
          p_content: content,
          p_confidence: options.confidence || null,
          p_suggested_questions: JSON.stringify(options.suggestedQuestions || []),
          p_related_concepts: JSON.stringify(options.relatedConcepts || []),
          p_status: options.status || 'delivered'
        })

      if (error) {
        console.error('Error adding chat message:', error)
        throw new Error(`Failed to add chat message: ${error.message}`)
      }

      // Fetch the created message
      const { data: message, error: fetchError } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('id', data)
        .single()

      if (fetchError) {
        console.error('Error fetching added message:', fetchError)
        throw new Error(`Failed to fetch added message: ${fetchError.message}`)
      }

      const dbMessage = message as DatabaseMessage
      return {
        id: dbMessage.id,
        sessionId: dbMessage.session_id,
        messageType: dbMessage.message_type,
        content: dbMessage.content,
        createdAt: new Date(dbMessage.created_at),
        status: dbMessage.status,
        confidence: dbMessage.confidence,
        suggestedQuestions: dbMessage.suggested_questions || [],
        relatedConcepts: dbMessage.related_concepts || [],
        feedback: dbMessage.feedback,
        feedbackAt: dbMessage.feedback_at ? new Date(dbMessage.feedback_at) : undefined,
        sequenceNumber: dbMessage.sequence_number
      }
    } catch (error) {
      console.error('Error in addMessage:', error)
      throw error
    }
  }

  /**
   * Get messages for a chat session
   */
  async getSessionMessages(
    sessionId: string, 
    limit: number = 50
  ): Promise<StoredChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('sequence_number', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching session messages:', error)
        throw new Error(`Failed to fetch session messages: ${error.message}`)
      }

      return (data || []).map((message: DatabaseMessage) => ({
        id: message.id,
        sessionId: message.session_id,
        messageType: message.message_type,
        content: message.content,
        createdAt: new Date(message.created_at),
        status: message.status,
        confidence: message.confidence,
        suggestedQuestions: message.suggested_questions || [],
        relatedConcepts: message.related_concepts || [],
        feedback: message.feedback,
        feedbackAt: message.feedback_at ? new Date(message.feedback_at) : undefined,
        sequenceNumber: message.sequence_number
      }))
    } catch (error) {
      console.error('Error in getSessionMessages:', error)
      throw error
    }
  }

  /**
   * Update message feedback
   */
  async updateMessageFeedback(
    messageId: string,
    feedback: 'helpful' | 'not_helpful'
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ 
          feedback,
          feedback_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) {
        console.error('Error updating message feedback:', error)
        throw new Error(`Failed to update message feedback: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in updateMessageFeedback:', error)
      throw error
    }
  }

  /**
   * Archive a chat session
   */
  async archiveSession(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error archiving session:', error)
        throw new Error(`Failed to archive session: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in archiveSession:', error)
      throw error
    }
  }

  /**
   * Convert stored message to ChatMessage format
   */
  storedMessageToChatMessage(stored: StoredChatMessage): ChatMessage {
    return {
      id: stored.id,
      type: stored.messageType,
      content: stored.content,
      timestamp: stored.createdAt,
      status: stored.status,
      feedback: stored.feedback,
      metadata: {
        confidence: stored.confidence,
        suggestedQuestions: stored.suggestedQuestions,
        relatedConcepts: stored.relatedConcepts
      }
    }
  }

  /**
   * Convert ChatMessage to stored format for database
   */
  chatMessageToStored(
    message: ChatMessage, 
    sessionId: string, 
    sequenceNumber: number
  ): Omit<StoredChatMessage, 'id' | 'createdAt'> {
    return {
      sessionId,
      messageType: message.type,
      content: message.content,
      status: message.status || 'delivered',
      confidence: message.metadata?.confidence,
      suggestedQuestions: message.metadata?.suggestedQuestions,
      relatedConcepts: message.metadata?.relatedConcepts,
      feedback: message.feedback,
      sequenceNumber
    }
  }

  /**
   * Export chat session for teacher review
   */
  async exportSession(sessionId: string): Promise<{
    session: ChatSession
    messages: StoredChatMessage[]
  }> {
    try {
      // Get session details
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        throw new Error(`Failed to fetch session: ${sessionError.message}`)
      }

      // Get all messages
      const messages = await this.getSessionMessages(sessionId, 1000) // Get all messages

      const dbSession = sessionData as DatabaseSession
      const session: ChatSession = {
        id: dbSession.id,
        userId: dbSession.user_id,
        documentId: dbSession.document_id,
        title: dbSession.title,
        createdAt: new Date(dbSession.created_at),
        updatedAt: new Date(dbSession.updated_at),
        lastMessageAt: new Date(dbSession.last_message_at),
        isActive: dbSession.is_active
      }

      return { session, messages }
    } catch (error) {
      console.error('Error in exportSession:', error)
      throw error
    }
  }

  /**
   * Clean up old sessions (run periodically)
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_old_chat_sessions')

      if (error) {
        console.error('Error cleaning up old sessions:', error)
        throw new Error(`Failed to cleanup old sessions: ${error.message}`)
      }

      return data || 0
    } catch (error) {
      console.error('Error in cleanupOldSessions:', error)
      throw error
    }
  }
} 