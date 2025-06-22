'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Eye, 
  Clock, 
  FileText, 
  Calendar,
  Bot,
  User,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatMessageComponent } from '@/components/tutor/chat-message';
import type { ChatMessage } from '@/components/tutor/chat-message';

interface ChatSession {
  id: string;
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessage: {
    type: 'user' | 'assistant';
    content: string;
    createdAt: string;
  } | null;
}

interface ChatSessionsProps {
  className?: string;
  documentId?: string;
  documentTitle?: string;
}

export function ChatSessions({ className = '', documentId, documentTitle }: ChatSessionsProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showSessionViewer, setShowSessionViewer] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadChatSessions();
  }, [documentId]);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query URL with document filter if provided
      let url = '/api/student/sessions';
      if (documentId) {
        url += `?documentId=${encodeURIComponent(documentId)}`;
      }

      console.log('🔍 Fetching chat sessions from:', url, 'for documentId:', documentId);

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - this is expected for new users
          setSessions([]);
          return;
        }
        throw new Error('Failed to load chat sessions');
      }

      const data = await response.json();
      
      console.log('💬 Chat Sessions Response:', {
        totalSessions: data.sessions?.length || 0,
        documentId,
        sessions: data.sessions?.map((s: ChatSession) => ({
          id: s.id,
          title: s.title,
          messageCount: s.messageCount,
          lastMessageAt: s.lastMessageAt
        }))
      });
      
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setError('Failed to load your chat sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = async (session: ChatSession) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    setShowSessionViewer(true);

    try {
      const response = await fetch(`/api/student/sessions/${session.id}`);
      if (!response.ok) {
        throw new Error('Failed to load session messages');
      }

      const data = await response.json();
      // Convert timestamp strings to Date objects and ensure metadata arrays are properly formatted
      const messagesWithDates = (data.messages || []).map((msg: any) => {
        // Ensure metadata arrays are properly formatted
        const metadata = msg.metadata ? {
          ...msg.metadata,
          relatedConcepts: Array.isArray(msg.metadata.relatedConcepts) 
            ? msg.metadata.relatedConcepts 
            : (msg.metadata.relatedConcepts ? [msg.metadata.relatedConcepts] : []),
          suggestedQuestions: Array.isArray(msg.metadata.suggestedQuestions)
            ? msg.metadata.suggestedQuestions
            : (msg.metadata.suggestedQuestions ? [msg.metadata.suggestedQuestions] : [])
        } : undefined;

        return {
          ...msg,
          timestamp: new Date(msg.timestamp),
          metadata
        };
      });
      setSessionMessages(messagesWithDates);
    } catch (error) {
      console.error('Error loading session messages:', error);
      setSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeIcon = (type: 'user' | 'assistant') => {
    return type === 'user' ? (
      <User className="h-3 w-3 text-blue-600" />
    ) : (
      <Bot className="h-3 w-3 text-emerald-600" />
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading your chat sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-8">
          <Alert>
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chat Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            AI Tutor Chat Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {documentTitle ? 'No chat sessions for this document yet' : 'No chat sessions yet'}
              </p>
              <p className="text-sm text-gray-400">
                {documentTitle 
                  ? 'Start chatting with the AI tutor in this document to see your sessions here'
                  : 'Start chatting with the AI tutor to see your sessions here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id} className="border border-gray-200 hover:border-emerald-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <MessageCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <h3 className="font-medium text-lg truncate">{session.title}</h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {session.messageCount} messages
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Started {formatDate(session.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Last active {formatDate(session.lastMessageAt)}</span>
                          </div>
                        </div>

                        {session.lastMessage && (
                          <div className="flex items-start space-x-2 bg-gray-50 rounded-lg p-3">
                            {getMessageTypeIcon(session.lastMessage.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-1">
                                Last message from {session.lastMessage.type === 'user' ? 'you' : 'AI tutor'}:
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2 overflow-hidden">
                                {session.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end sm:justify-start sm:flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSession(session)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Viewer Dialog */}
      <Dialog open={showSessionViewer} onOpenChange={setShowSessionViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              {selectedSession?.title || 'Chat Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading chat messages...</span>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {sessionMessages.map((message) => (
                  <ChatMessageComponent
                    key={message.id}
                    message={message}
                    onCopy={(content) => navigator.clipboard.writeText(content)}
                    onFeedback={(messageId, feedback) => {
                      console.log(`Message ${messageId} marked as ${feedback}`)
                    }}
                  />
                ))}
                {sessionMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No messages found in this session.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 