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
import { getSupabaseClient } from "@/lib/supabase/client"
import { FileText, Clock, User, AlertCircle, Loader2, BookOpen, Target } from "lucide-react"

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

export function DocumentViewer({
  documentId,
  open,
  onOpenChange,
  studentEmail,
}: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (open && documentId) {
      fetchDocument()
    }
  }, [open, documentId])

  const fetchDocument = async () => {
    if (!documentId) return
    
    setLoading(true)
    setError("")
    
    try {
      const supabase = getSupabaseClient()
      
      // Fetch document data
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single()

      if (error) {
        console.error("Error fetching document:", error)
        setError("Failed to load document")
      } else {
        // Calculate additional metrics
        const wordCount = data.content ? data.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0
        const characterCount = data.content ? data.content.length : 0
        
        setDocument({
          ...data,
          word_count: wordCount,
          character_count: characterCount
        })
      }
    } catch (err) {
      console.error("Error fetching document:", err)
      setError("Failed to load document")
    } finally {
      setLoading(false)
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
                <Button onClick={fetchDocument} variant="outline">
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
                </div>
              </div>
              
              {/* Document Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="whitespace-pre-wrap bg-gray-50 p-6 rounded-lg border min-h-[300px]"
                    style={{ 
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      lineHeight: '1.6'
                    }}
                  >
                    {document.content || (
                      <span className="text-gray-400 italic">No content available</span>
                    )}
                  </div>
                </div>
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
    </Dialog>
  )
} 