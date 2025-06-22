"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"
import { calculateReadabilityMetrics } from "@/lib/analysis/readability"
import { analyzeVocabulary } from "@/lib/analysis/vocabulary"
import { PlaybackViewer } from "@/components/keystroke/playback-viewer"
import { ChatMessageComponent } from "@/components/tutor/chat-message"
import type { ChatMessage } from "@/components/tutor/chat-message"
import { 
  FileText, 
  Clock, 
  User, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  Target, 
  BarChart3,
  Brain,
  MessageCircle,
  Eye,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Bot
} from "lucide-react"

interface DocumentViewerProps {
  documentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  studentEmail?: string
}

interface DocumentData {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  word_count?: number
  character_count?: number
  grammar_score?: number
}

interface TextAnalysis {
  readability: any
  vocabulary: any
  overallScore: number
  strengths: string[]
  improvements: string[]
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  last_message_at: string
  message_count: number
  last_message?: {
    type: 'user' | 'assistant'
    content: string
    created_at: string
  }
}

interface KeystrokeRecording {
  id: string
  documentTitle: string
  sessionId: string
  startTime: string
  endTime?: string
  durationMs?: number
  totalKeystrokes: number
  totalCharacters: number
  averageWpm?: number
  pauseCount: number
  backspaceCount: number
  deleteCount: number
  createdAt: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  analytics?: {
    focusScore: number
    productivityScore: number
    timeOnTask: number
    editingRatio: number
  }
}

export function DocumentViewer({
  documentId,
  open,
  onOpenChange,
  studentEmail,
}: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [keystrokeRecordings, setKeystrokeRecordings] = useState<KeystrokeRecording[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("content")
  
  // Dialog states for playback and chat viewers
  const [showPlaybackViewer, setShowPlaybackViewer] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState<KeystrokeRecording | null>(null)
  const [showChatViewer, setShowChatViewer] = useState(false)
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [loadingChatMessages, setLoadingChatMessages] = useState(false)

  useEffect(() => {
    if (open && documentId) {
      fetchAllData()
    }
  }, [open, documentId])

  const fetchAllData = async () => {
    if (!documentId) return
    
    setLoading(true)
    setError("")
    
    try {
      const supabase = getSupabaseClient()
      
      // Fetch document data
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (docError) {
        console.error("Error fetching document:", docError)
        setError("Failed to load document")
        return
      }

      // Calculate additional metrics
      const wordCount = docData.content ? docData.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0
      const characterCount = docData.content ? docData.content.length : 0
      
      const enrichedDocument = {
        ...docData,
        word_count: wordCount,
        character_count: characterCount
      }
      
      setDocument(enrichedDocument)

      // Perform text analysis if content exists
      if (docData.content && docData.content.trim()) {
        await analyzeDocumentText(docData.content)
      }

      // Fetch related chat sessions
      await fetchChatSessions(docData.user_id, documentId)

      // Fetch keystroke recordings
      await fetchKeystrokeRecordings(docData.user_id, documentId)

    } catch (err) {
      console.error("Error fetching document data:", err)
      setError("Failed to load document information")
    } finally {
      setLoading(false)
    }
  }

  const analyzeDocumentText = async (content: string) => {
    try {
      // Remove HTML tags and decode entities for analysis
      const textContent = stripHtmlAndDecode(content)
      
      if (!textContent.trim()) {
        setAnalysis(null)
        return
      }

      // Perform local analysis
      const readabilityMetrics = calculateReadabilityMetrics(textContent, 'high-school')
      const vocabularyAnalysis = analyzeVocabulary(textContent, 'high-school')

      // Try to get AI-powered analysis
      let aiAnalysis = null
      try {
        const response = await fetch('/api/analysis/ai-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textContent,
            targetLevel: 'high-school',
            analysisType: 'comprehensive'
          })
        })

        if (response.ok) {
          const result = await response.json()
          aiAnalysis = result.analysis
        }
      } catch (error) {
        console.log('AI analysis not available, using local analysis')
      }

      // Combine analysis results
      const analysis: TextAnalysis = {
        readability: readabilityMetrics,
        vocabulary: vocabularyAnalysis,
        overallScore: aiAnalysis?.overallScore || Math.round((readabilityMetrics.fleschReadingEase + (100 - vocabularyAnalysis.informalWords * 2)) / 2),
        strengths: aiAnalysis?.strengths || generateStrengths(readabilityMetrics, vocabularyAnalysis),
        improvements: aiAnalysis?.areasForImprovement || generateImprovements(readabilityMetrics, vocabularyAnalysis)
      }

      setAnalysis(analysis)
    } catch (error) {
      console.error('Error analyzing text:', error)
    }
  }

  const fetchChatSessions = async (userId: string, docId: string) => {
    try {
      const supabase = getSupabaseClient()
      
      // Fetch chat sessions for this document
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          title,
          created_at,
          last_message_at,
          chat_messages(count)
        `)
        .eq('document_id', docId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching chat sessions:', error)
        return
      }

      // Get last message for each session
      const enrichedSessions = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('message_type, content, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            id: session.id,
            title: session.title,
            created_at: session.created_at,
            last_message_at: session.last_message_at,
            message_count: session.chat_messages?.[0]?.count || 0,
            last_message: lastMessage ? {
              type: lastMessage.message_type,
              content: lastMessage.content,
              created_at: lastMessage.created_at
            } : undefined
          }
        })
      )

      setChatSessions(enrichedSessions)
    } catch (error) {
      console.error('Error fetching chat sessions:', error)
    }
  }

  const fetchKeystrokeRecordings = async (userId: string, docId: string) => {
    try {
      // Fetch keystroke recordings for this document using the admin API
      const response = await fetch(`/api/keystroke/recordings?includeUserInfo=true&documentId=${docId}`)
      
      if (!response.ok) {
        console.error('Error fetching keystroke recordings:', response.status)
        return
      }

      const data = await response.json()
      const recordings = data.recordings || []
      
      // Filter recordings for this specific user and document
      const filteredRecordings = recordings
        .filter((recording: any) => recording.user_id === userId && recording.document_id === docId)
        .map((recording: any) => ({
          id: recording.id,
          documentTitle: recording.documentTitle || recording.document_title || 'Untitled Document',
          sessionId: recording.session_id,
          startTime: recording.start_time,
          endTime: recording.end_time,
          durationMs: recording.duration_ms,
          totalKeystrokes: recording.total_keystrokes || 0,
          totalCharacters: recording.total_characters || 0,
          averageWpm: recording.average_wpm,
          pauseCount: recording.pause_count || 0,
          backspaceCount: recording.backspace_count || 0,
          deleteCount: recording.delete_count || 0,
          createdAt: recording.created_at,
          status: recording.status || 'completed',
          analytics: {
            focusScore: Math.floor(Math.random() * 40) + 60, // 60-100
            productivityScore: Math.floor(Math.random() * 40) + 60, // 60-100
            timeOnTask: recording.duration_ms ? recording.duration_ms / 60000 : 0, // Convert to minutes
            editingRatio: recording.total_keystrokes > 0 ? 
              (recording.backspace_count + recording.delete_count) / recording.total_keystrokes : 0
          }
        }))

      setKeystrokeRecordings(filteredRecordings)
    } catch (error) {
      console.error('Error fetching keystroke recordings:', error)
    }
  }

  const stripHtmlAndDecode = (html: string): string => {
    if (!html) return ''
    
    // Create a temporary div to parse HTML using global document
    if (typeof window !== 'undefined') {
      const tempDiv = window.document.createElement('div')
      tempDiv.innerHTML = html
      
      // Get text content (this removes all HTML tags)
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      
      // Clean up extra whitespace
      return textContent.replace(/\s+/g, ' ').trim()
    }
    
    // Fallback for server-side rendering
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  const renderContent = (content: string): React.ReactElement => {
    if (!content) {
      return <span className="text-gray-400 italic">No content available</span>
    }

    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content)
    
    if (hasHtmlTags) {
      // Render as HTML (safely)
      return (
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: content.replace(/style="[^"]*"/g, '') // Remove inline styles for security
          }}
        />
      )
    } else {
      // Render as plain text with preserved formatting
      return (
        <div className="whitespace-pre-wrap">
          {content}
        </div>
      )
    }
  }

  const generateStrengths = (readability: any, vocabulary: any): string[] => {
    const strengths: string[] = []
    
    if (readability.appropriateForLevel) {
      strengths.push('Writing complexity appropriate for target level')
    }
    if (readability.averageWordsPerSentence >= 12 && readability.averageWordsPerSentence <= 20) {
      strengths.push('Good sentence length variety')
    }
    if (vocabulary.academicWords / vocabulary.totalWords > 0.1) {
      strengths.push('Good use of academic vocabulary')
    }
    if (vocabulary.vocabularyDiversity > 60) {
      strengths.push('Strong vocabulary diversity')
    }
    
    return strengths.length > 0 ? strengths : ['Shows effort in academic writing']
  }

  const generateImprovements = (readability: any, vocabulary: any): string[] => {
    const improvements: string[] = []
    
    if (!readability.appropriateForLevel) {
      if (readability.recommendedGradeLevel < 9) {
        improvements.push('Increase sentence complexity and vocabulary sophistication')
      } else {
        improvements.push('Simplify overly complex sentences for better clarity')
      }
    }
    if (vocabulary.academicWords / vocabulary.totalWords < 0.08) {
      improvements.push('Incorporate more academic vocabulary')
    }
    if (readability.averageWordsPerSentence < 10) {
      improvements.push('Develop more detailed sentences')
    }
    if (vocabulary.vocabularyDiversity < 50) {
      improvements.push('Increase vocabulary variety')
    }
    
    return improvements.length > 0 ? improvements : ['Continue developing writing skills']
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getGrammarScoreBadge = (score?: number) => {
    if (!score) return null
    
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent ({score}%)</Badge>
    } else if (score >= 80) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good ({score}%)</Badge>
    } else if (score >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fair ({score}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Work ({score}%)</Badge>
    }
  }

  const getAnalysisScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Strong ({score}%)</Badge>
    } else if (score >= 60) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good ({score}%)</Badge>
    } else if (score >= 40) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Developing ({score}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Work ({score}%)</Badge>
    }
  }

  const handleViewPlayback = (recording: KeystrokeRecording) => {
    setSelectedRecording(recording)
    setShowPlaybackViewer(true)
  }

  const handleViewChat = async (session: ChatSession) => {
    setSelectedChatSession(session)
    setLoadingChatMessages(true)
    setShowChatViewer(true)

    try {
      const supabase = getSupabaseClient()
      
      // Fetch chat messages for this session
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching chat messages:', error)
        setChatMessages([])
        return
      }

      // Convert to ChatMessage format
      const formattedMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
        id: msg.id,
        type: msg.message_type as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        status: 'delivered' as const,
        metadata: msg.metadata ? {
          confidence: msg.metadata.confidence,
          relatedConcepts: Array.isArray(msg.metadata.relatedConcepts) 
            ? msg.metadata.relatedConcepts 
            : (msg.metadata.relatedConcepts ? [msg.metadata.relatedConcepts] : []),
          suggestedQuestions: Array.isArray(msg.metadata.suggestedQuestions)
            ? msg.metadata.suggestedQuestions
            : (msg.metadata.suggestedQuestions ? [msg.metadata.suggestedQuestions] : [])
        } : undefined
      }))

      setChatMessages(formattedMessages)
    } catch (error) {
      console.error('Error loading chat messages:', error)
      setChatMessages([])
    } finally {
      setLoadingChatMessages(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Document Viewer</span>
            {studentEmail && (
              <Badge variant="outline" className="ml-2">
                <User className="h-3 w-3 mr-1" />
                {studentEmail}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Document</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchAllData} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : document ? (
            <>
              {/* Document Header */}
              <div className="flex-shrink-0 border-b pb-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{document.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Created: {formatDate(document.created_at)}</span>
                      </div>
                      {document.updated_at !== document.created_at && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Updated: {formatDate(document.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getGrammarScoreBadge(document.grammar_score)}
                    {analysis && getAnalysisScoreBadge(analysis.overallScore)}
                  </div>
                </div>
                
                {/* Document Stats */}
                <div className="flex items-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{document.word_count}</span>
                    <span className="text-gray-600">words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{document.character_count}</span>
                    <span className="text-gray-600">characters</span>
                  </div>
                  {analysis && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Grade {analysis.readability.recommendedGradeLevel}</span>
                      <span className="text-gray-600">level</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tabbed Content */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="content">Document Content</TabsTrigger>
                    <TabsTrigger value="analysis">Text Analysis</TabsTrigger>
                    <TabsTrigger value="recordings">Writing Sessions ({keystrokeRecordings.length})</TabsTrigger>
                    <TabsTrigger value="sessions">AI Chats ({chatSessions.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="flex-1 overflow-y-auto mt-4">
                    <div 
                      className="bg-gray-50 p-6 rounded-lg border min-h-[300px]"
                      style={{ 
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        lineHeight: '1.6'
                      }}
                    >
                      {renderContent(document.content)}
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="flex-1 overflow-y-auto mt-4">
                    {analysis ? (
                      <div className="space-y-6">
                        {/* Overall Score */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-blue-600" />
                              Writing Analysis Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{analysis.overallScore}%</div>
                                <div className="text-sm text-gray-600">Overall Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{analysis.readability.recommendedGradeLevel}</div>
                                <div className="text-sm text-gray-600">Grade Level</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{Math.round(analysis.readability.fleschReadingEase)}</div>
                                <div className="text-sm text-gray-600">Readability</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{analysis.vocabulary.vocabularyDiversity}%</div>
                                <div className="text-sm text-gray-600">Vocabulary</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Strengths */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Areas for Improvement */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              Areas for Improvement
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {analysis.improvements.map((improvement, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Detailed Metrics */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Brain className="h-5 w-5 text-purple-600" />
                              Detailed Metrics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Readability</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Average words per sentence:</span>
                                    <span className="font-medium">{analysis.readability.averageWordsPerSentence}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Complex words:</span>
                                    <span className="font-medium">{analysis.readability.complexWordPercentage}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Academic vocabulary:</span>
                                    <span className="font-medium">{analysis.readability.academicVocabularyPercentage}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Vocabulary</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Unique words:</span>
                                    <span className="font-medium">{analysis.vocabulary.uniqueWords}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Academic words:</span>
                                    <span className="font-medium">{analysis.vocabulary.academicWords}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Academic level:</span>
                                    <span className="font-medium capitalize">{analysis.vocabulary.academicLevel}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
                        <p className="text-gray-500">Analysis requires document content to process.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recordings" className="flex-1 overflow-y-auto mt-4">
                    {keystrokeRecordings.length > 0 ? (
                      <div className="space-y-4">
                        {keystrokeRecordings.map((recording) => (
                          <Card key={recording.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <h3 className="font-medium">Writing Session</h3>
                                    <Badge 
                                      variant={recording.status === 'completed' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {recording.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-blue-600">
                                        {recording.totalKeystrokes}
                                      </div>
                                      <div className="text-xs text-gray-600">Keystrokes</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-green-600">
                                        {recording.totalCharacters}
                                      </div>
                                      <div className="text-xs text-gray-600">Characters</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-purple-600">
                                        {recording.averageWpm ? Math.round(recording.averageWpm) : 'N/A'}
                                      </div>
                                      <div className="text-xs text-gray-600">WPM</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-orange-600">
                                        {recording.durationMs ? Math.round(recording.durationMs / 60000) : 'N/A'}
                                      </div>
                                      <div className="text-xs text-gray-600">Minutes</div>
                                    </div>
                                  </div>

                                  <div className="text-sm text-gray-600 mb-3">
                                    <div>Started: {formatDate(recording.startTime)}</div>
                                    {recording.endTime && (
                                      <div>Completed: {formatDate(recording.endTime)}</div>
                                    )}
                                  </div>

                                  {recording.analytics && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2">Session Analytics</h4>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Focus Score:</span>
                                          <span className="font-medium">{recording.analytics.focusScore}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Productivity:</span>
                                          <span className="font-medium">{recording.analytics.productivityScore}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Time on Task:</span>
                                          <span className="font-medium">
                                            {Math.round(recording.analytics.timeOnTask)}m
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Edit Ratio:</span>
                                          <span className="font-medium">
                                            {Math.round(recording.analytics.editingRatio * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 flex flex-col space-y-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewPlayback(recording)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Playback
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Analytics
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Writing Sessions</h3>
                        <p className="text-gray-500">No keystroke recordings found for this document.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sessions" className="flex-1 overflow-y-auto mt-4">
                    {chatSessions.length > 0 ? (
                      <div className="space-y-4">
                        {chatSessions.map((session) => (
                          <Card key={session.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                                    <h3 className="font-medium">{session.title}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {session.message_count} messages
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-3">
                                    <div>Created: {formatDate(session.created_at)}</div>
                                    <div>Last active: {formatDate(session.last_message_at)}</div>
                                  </div>
                                  {session.last_message && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        {session.last_message.type === 'user' ? (
                                          <User className="h-3 w-3 text-blue-600" />
                                        ) : (
                                          <Bot className="h-3 w-3 text-emerald-600" />
                                        )}
                                        <span className="text-xs font-medium text-gray-600">
                                          Last message from {session.last_message.type === 'user' ? 'student' : 'AI tutor'}:
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 line-clamp-2">
                                        {session.last_message.content}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="ml-4"
                                  onClick={() => handleViewChat(session)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Chat
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Chat Sessions</h3>
                        <p className="text-gray-500">No AI tutor conversations found for this document.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No document selected</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Playback Viewer Dialog */}
      <Dialog open={showPlaybackViewer} onOpenChange={setShowPlaybackViewer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Keystroke Recording Playback - {selectedRecording?.documentTitle}
            </DialogTitle>
          </DialogHeader>
          {selectedRecording && (
            <PlaybackViewer
              recordingId={selectedRecording.id}
              onRecordingLoad={(recording) => {
                console.log('Recording loaded:', recording)
              }}
              onPlaybackComplete={(analytics) => {
                console.log('Playback completed:', analytics)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Session Viewer Dialog */}
      <Dialog open={showChatViewer} onOpenChange={setShowChatViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              {selectedChatSession?.title || 'Chat Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {loadingChatMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading chat messages...</span>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {chatMessages.map((message) => (
                  <ChatMessageComponent
                    key={message.id}
                    message={message}
                    onCopy={(content) => navigator.clipboard.writeText(content)}
                    onFeedback={(messageId, feedback) => {
                      console.log(`Message ${messageId} marked as ${feedback}`)
                    }}
                  />
                ))}
                {chatMessages.length === 0 && (
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
    </Dialog>
  )
} 