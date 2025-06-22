'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Home, Save, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TextEditor } from '@/components/text-editor'
import { RightSidebar } from '@/components/sidebar/right-sidebar'
import { DocumentActions } from '@/components/editor/document-actions'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRoleBasedFeatures } from '@/lib/hooks/use-user-role'
import type { Document } from '@/lib/types'

function DocumentContent() {
  const params = useParams()
  const router = useRouter()
  const documentId = params?.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)

  const { canCreateDocuments, canSaveWork } = useRoleBasedFeatures()

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

  const handleSave = async () => {
    // TextEditor handles its own saving, this is for the DocumentActions component
    if (document) {
      setDocument({ ...document, updated_at: new Date().toISOString() })
    }
  }

  const handleNewDocument = async () => {
    const supabase = getSupabaseClient()
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      console.error("Error getting user for new document:", userError)
      return
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({ 
        title: "Untitled Document", 
        content: "",
        user_id: userData.user.id
      })
      .select()
      .single()
      
    if (error) {
      console.error("Error creating new document:", error)
    } else if (data) {
      router.push(`/documents/${data.id}`)
    }
  }

  const handleDeleteDocument = async () => {
    if (!document) return

    const confirmed = confirm('Are you sure you want to delete this document? This action cannot be undone.')
    if (!confirmed) return

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)

      if (error) {
        console.error('Error deleting document:', error)
        setError('Failed to delete document. Please try again.')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Error deleting document:', err)
      setError('Failed to delete document. Please try again.')
    }
  }

  const handleSwitchDocument = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left side - Breadcrumb and title */}
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">
                  <Home className="h-4 w-4" />
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {document.title}
                </span>
              </nav>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <DocumentActions
                onNew={handleNewDocument}
                onSave={handleSave}
                onDelete={handleDeleteDocument}
                onSwitch={handleSwitchDocument}
                isSaving={saving}
                documentId={document.id}
                documentTitle={document.title}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 max-w-7xl mx-auto">
        {/* Main Editor Area */}
        <main className="flex-1 min-w-0">
          <div className="p-6">
                       <TextEditor
               initialDocument={document}
               onSave={(savedDoc) => setDocument(savedDoc)}
               onDelete={handleDeleteDocument}
               onNew={handleNewDocument}
               onSelect={(doc) => setDocument(doc)}
               onUnselect={() => {}}
               isRightSidebarCollapsed={isRightSidebarCollapsed}
               onExpandRightSidebar={() => setIsRightSidebarCollapsed(false)}
             />
          </div>
        </main>

        {/* Right Sidebar */}
        {!isRightSidebarCollapsed && (
          <aside className="w-80 border-l border-gray-200 bg-white">
            <RightSidebar
              document={document}
              aiAvailable={true}
              onCollapse={() => setIsRightSidebarCollapsed(true)}
            />
          </aside>
        )}

        {/* Collapsed sidebar button */}
        {isRightSidebarCollapsed && (
          <div className="fixed right-4 top-20 z-20">
            <Button
              onClick={() => setIsRightSidebarCollapsed(false)}
              size="sm"
              variant="outline"
              className="h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50"
              title="Show writing tools and analysis"
            >
              <BarChart3 className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="border-red-200 bg-red-50 max-w-sm">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

export default function DocumentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DocumentContent />
    </Suspense>
  )
} 