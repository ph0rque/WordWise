'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Send, 
  RotateCcw, 
  Download, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react'
import { ChatMessageComponent, type ChatMessage } from './chat-message'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  documentId: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatPanelProps {
  documentId: string
  documentContent?: string
  documentTitle?: string
  aiAvailable?: boolean
  isStudent?: boolean
  onExportChat?: (session: ChatSession) => void
  className?: string
}





export function ChatPanel({ 
  documentId, 
  documentContent = '', 
  documentTitle = 'Untitled Document',
  aiAvailable = false,
  isStudent = true,
  onExportChat,
  className = '' 
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize session
  useEffect(() => {
    if (documentId) {
      const newSessionId = `session-${documentId}-${Date.now()}`
      setSessionId(newSessionId)
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: `Hi! I'm your AI writing tutor. I'm here to help you improve your writing for "${documentTitle}". I can help with structure, clarity, grammar concepts, and writing techniques.\n\nRemember: I won't write your essay for you, but I'll guide you to become a better writer! What would you like to work on?`,
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          confidence: 95
        }
      }
      
      setMessages([welcomeMessage])
    }
  }, [documentId, documentTitle])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle copying message content
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }, [])

  // Handle message feedback
  const handleMessageFeedback = useCallback((messageId: string, feedback: 'helpful' | 'not_helpful') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback }
        : msg
    ))
    
    // Could send feedback to analytics here
    console.log(`Message ${messageId} marked as ${feedback}`)
  }, [])



  // Send message to AI tutor
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || !aiAvailable) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      status: 'sent'
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/essay-tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          documentId,
          documentContent,
          documentTitle,
          isStudent,
          messageHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Server error (${response.status}): ${response.statusText}`)
      }

      // Parse response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing API response:', parseError)
        throw new Error('Invalid response from server. Please try again.')
      }

      // Check if the response indicates an error (even with 200 status)
      if (data.error) {
        setError(data.content || 'The AI tutor encountered an issue. Please try again.')
      }
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.content || 'I apologize, but I had trouble generating a response.',
        timestamp: new Date(),
        status: data.error ? 'error' : 'delivered',
        metadata: {
          confidence: data.confidence || 0,
          relatedConcepts: data.relatedConcepts || []
        }
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error in sendMessage:', error)
      
      // Determine the type of error and provide appropriate feedback
      let errorMessage = 'Sorry, I had trouble responding. Please try again.'
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Connection issue detected. Please check your internet connection and try again.'
      } else if (error instanceof Error) {
        // Use the error message if it's user-friendly
        if (error.message.includes('Server error') || 
            error.message.includes('Invalid response') ||
            error.message.includes('Connection')) {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      
      // Add error message to chat
      const errorMessage_chat: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        status: 'error'
      }
      
      setMessages(prev => [...prev, errorMessage_chat])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, isLoading, aiAvailable, sessionId, documentContent, documentTitle, isStudent, messages, documentId])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    // Re-add welcome message
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      type: 'assistant',
      content: `Let's start fresh! I'm here to help you improve your writing. What would you like to work on?`,
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        confidence: 95
      }
    }
    setMessages([welcomeMessage])
  }, [])

  // Export chat session
  const exportChat = useCallback(() => {
    if (onExportChat) {
      const session: ChatSession = {
        id: sessionId,
        documentId: documentId || '',
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      onExportChat(session)
    }
  }, [sessionId, documentId, messages, onExportChat])

  if (!aiAvailable) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Writing Tutor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI tutoring is not available. Please check your connection or try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col min-h-0", className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" />
            AI Writing Tutor
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              title="Clear chat"
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {onExportChat && messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={exportChat}
                title="Export chat for review"
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <Alert className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 min-h-0 p-0">
        <div className="h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onCopy={handleCopyMessage}
                onFeedback={handleMessageFeedback}
              />
            ))}
            
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <Card className="w-fit bg-white border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>



          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t bg-white">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about your writing..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <HelpCircle className="h-3 w-3" />
                    <span>I'll help you improve, not write for you</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {inputMessage.length}/500
                  </div>
                </div>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || inputMessage.length > 500}
                className="self-start"
                size="sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 