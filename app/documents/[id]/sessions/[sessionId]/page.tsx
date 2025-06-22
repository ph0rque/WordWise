'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Home, Play } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlaybackViewer } from '@/components/keystroke/playback-viewer'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

interface SessionData {
  id: string
  title: string
  start_time: string
  end_time?: string
  duration_ms?: number
  total_keystrokes: number
  total_characters: number
  average_wpm?: number
  created_at: string
  status: 'active' | 'paused' | 'completed'
}

function SessionContent() {
  const params = useParams()
  const documentId = params?.id as string
  const sessionId = params?.sessionId as string
  const [document, setDocument] = useState<Document | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (documentId && sessionId) {
      loadData()
    }
  }, [documentId, sessionId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const supabase = getSupabaseClient()
      
      // Load document
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (documentError) {
        console.error('Error loading document:', documentError)
        setError('Document not found or you do not have permission to view it.')
        return
      }

      setDocument(documentData)

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('keystroke_recordings')
        .select('*')
        .eq('id', sessionId)
        .eq('document_id', documentId)
        .single()

      if (sessionError) {
        console.error('Error loading session:', sessionError)
        setError('Session not found or you do not have permission to view it.')
        return
      }

      setSession(sessionData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load session data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSessionTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !document || !session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error || 'Session not found'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 space-x-2">
          <Link href={`/documents/${documentId}/sessions`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-foreground">
          {document.title}
        </Link>
        <span>/</span>
        <Link href={`/documents/${documentId}/sessions`} className="hover:text-foreground">
          Writing Sessions
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          Session at {formatSessionTimestamp(session.created_at)}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/documents/${documentId}/sessions`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Writing Session Playback
          </h1>
          <p className="text-muted-foreground mt-2">
            {document.title} • {formatSessionTimestamp(session.created_at)} • {session.total_keystrokes} keystrokes
          </p>
        </div>
      </div>

      {/* Session Playback */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {session.status === 'completed' ? (
          <PlaybackViewer
            recordingId={sessionId}
            onRecordingLoad={(recording) => {
              console.log('Recording loaded:', recording);
            }}
            onPlaybackComplete={(analytics) => {
              console.log('Playback completed:', analytics);
            }}
          />
        ) : (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session Not Complete
            </h3>
            <p className="text-gray-600">
              This session is still {session.status}. Playback is only available for completed sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  )
} 