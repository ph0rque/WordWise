'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Home, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MyRecordings } from '@/components/student/my-recordings'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

function DocumentSessionsContent() {
  const params = useParams()
  const documentId = params?.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError('')
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        console.error('Error loading document:', error)
        setError('Document not found or you do not have permission to view it.')
        return
      }

      setDocument(data)
    } catch (err) {
      console.error('Error loading document:', err)
      setError('Failed to load document. Please try again.')
    } finally {
      setLoading(false)
    }
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

  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error || 'Document not found'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
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
        <span className="text-foreground font-medium">Writing Sessions</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Document
            </Button>
          </Link>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Writing Sessions for "{document.title}"
          </h1>
          <p className="text-muted-foreground mt-2">
            View and analyze your writing sessions for this document. Each session shows your keystroke patterns, writing speed, and productivity metrics.
          </p>
        </div>
      </div>

      {/* Sessions Content */}
      <MyRecordings 
        documentId={documentId}
        documentTitle={document.title}
        className="min-h-[600px]"
      />
    </div>
  )
}

export default function DocumentSessionsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <DocumentSessionsContent />
    </Suspense>
  )
} 