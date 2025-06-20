'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bot, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Simple markdown renderer for AI responses
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  
  let currentParagraph: string[] = []
  let inList = false
  let listItems: string[] = []
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n')
      elements.push(
        <p key={elements.length} className="mb-2 last:mb-0">
          {parseInlineMarkdown(paragraphText)}
        </p>
      )
      currentParagraph = []
    }
  }
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="mb-2 last:mb-0 pl-4 space-y-1">
          {listItems.map((item, index) => (
            <li key={index} className="list-disc">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
      listItems = []
      inList = false
    }
  }
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    // Handle bullet points
    if (trimmedLine.match(/^[•·\-\*]\s+/)) {
      if (!inList) {
        flushParagraph()
        inList = true
      }
      listItems.push(trimmedLine.replace(/^[•·\-\*]\s+/, ''))
    } else if (trimmedLine === '') {
      // Empty line - flush current content
      if (inList) {
        flushList()
      } else {
        flushParagraph()
      }
    } else {
      // Regular text
      if (inList) {
        flushList()
      }
      currentParagraph.push(line)
    }
  })
  
  // Flush remaining content
  if (inList) {
    flushList()
  } else {
    flushParagraph()
  }
  
  return elements
}

// Parse inline markdown like **bold** and *italic*
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: Array<{ type: 'bold' | 'italic', content: string, placeholder: string }> = []
  let currentText = text
  let key = 0
  
  // Handle **bold**
  currentText = currentText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    const placeholder = `__BOLD_${key}__`
    parts.push({ type: 'bold', content, placeholder })
    key++
    return placeholder
  })
  
  // Handle *italic*
  currentText = currentText.replace(/\*(.*?)\*/g, (match, content) => {
    const placeholder = `__ITALIC_${key}__`
    parts.push({ type: 'italic', content, placeholder })
    key++
    return placeholder
  })
  
  // Split by placeholders and reconstruct
  let result: React.ReactNode[] = [currentText]
  
  parts.forEach((part) => {
    result = result.flatMap((item) => {
      if (typeof item === 'string' && item.includes(part.placeholder)) {
        const splitParts = item.split(part.placeholder)
        const newParts: React.ReactNode[] = []
        
        splitParts.forEach((textPart, index) => {
          if (textPart) newParts.push(textPart)
          if (index < splitParts.length - 1) {
            if (part.type === 'bold') {
              newParts.push(<strong key={`${part.placeholder}-${index}`}>{part.content}</strong>)
            } else if (part.type === 'italic') {
              newParts.push(<em key={`${part.placeholder}-${index}`}>{part.content}</em>)
            }
          }
        })
        
        return newParts
      }
      return item
    })
  })
  
  return result
}

export type MessageType = 'user' | 'assistant' | 'system'
export type MessageStatus = 'sending' | 'sent' | 'error' | 'delivered'

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  status?: MessageStatus
  feedback?: 'helpful' | 'not_helpful' | null
  metadata?: {
    confidence?: number
    suggestedQuestions?: string[]
    relatedConcepts?: string[]
    wordCount?: number
  }
}

interface ChatMessageProps {
  message: ChatMessage
  onCopy?: (content: string) => void
  onFeedback?: (messageId: string, feedback: 'helpful' | 'not_helpful') => void
  onQuestionClick?: (question: string) => void
  className?: string
}

export function ChatMessageComponent({ 
  message, 
  onCopy, 
  onFeedback, 
  onQuestionClick,
  className = '' 
}: ChatMessageProps) {
  const isUser = message.type === 'user'
  const isSystem = message.type === 'system'
  const isAssistant = message.type === 'assistant'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  if (isSystem) {
    return (
      <div className={cn("flex justify-center my-4", className)}>
        <Badge variant="secondary" className="text-xs px-3 py-1">
          {message.content}
        </Badge>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-blue-100 text-blue-600" 
          : "bg-emerald-100 text-emerald-600"
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%] min-w-0",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}>
        <Card className={cn(
          "w-fit max-w-full min-w-0",
          isUser 
            ? "bg-blue-50 border-blue-200" 
            : "bg-white border-gray-200"
        )}>
          <CardContent className="p-3 min-w-0 overflow-hidden">
            <div className="prose prose-sm max-w-none min-w-0">
              <div className="text-sm leading-relaxed break-words">
                {isAssistant ? renderMarkdown(message.content) : (
                  <p className="m-0 whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata for assistant messages */}
            {isAssistant && message.metadata && (
              <div className="mt-3 space-y-2">
                {/* Confidence score */}
                {message.metadata.confidence && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <Badge 
                      variant={message.metadata.confidence > 80 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {message.metadata.confidence}%
                    </Badge>
                  </div>
                )}

                {/* Suggested follow-up questions */}
                {message.metadata.suggestedQuestions && message.metadata.suggestedQuestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">You might also ask:</span>
                    <div className="space-y-1">
                      {message.metadata.suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-2 text-xs text-left justify-start hover:bg-blue-50"
                          onClick={() => onQuestionClick?.(question)}
                        >
                          "{question}"
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related concepts */}
                {message.metadata.relatedConcepts && message.metadata.relatedConcepts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">Related concepts:</span>
                    <div className="flex flex-wrap gap-1">
                      {message.metadata.relatedConcepts.map((concept, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message footer */}
        <div className={cn(
          "flex items-center gap-2 mt-1 px-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatTime(message.timestamp)}
            {getStatusIcon()}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => onCopy?.(message.content)}
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </Button>

            {/* Feedback buttons for assistant messages */}
            {isAssistant && onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 hover:bg-green-100",
                    message.feedback === 'helpful' && "bg-green-100 text-green-600"
                  )}
                  onClick={() => onFeedback(message.id, 'helpful')}
                  title="Mark as helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 hover:bg-red-100",
                    message.feedback === 'not_helpful' && "bg-red-100 text-red-600"
                  )}
                  onClick={() => onFeedback(message.id, 'not_helpful')}
                  title="Mark as not helpful"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 