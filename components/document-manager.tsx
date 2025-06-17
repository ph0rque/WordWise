"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Plus, MoreVertical, Trash2, Edit, AlertCircle, Database } from "lucide-react"
import type { Document } from "@/lib/types"

interface DocumentManagerProps {
  onSelectDocument: (document: Document) => void
  onNewDocument: (document: Document) => void
  currentDocumentId?: string
  refreshDocumentsFlag?: number
}

export function DocumentManager({ onSelectDocument, onNewDocument, currentDocumentId, refreshDocumentsFlag }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [newDocTitle, setNewDocTitle] = useState("")
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)
  const [error, setError] = useState<string>("")
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchDocuments()
    } else {
      setLoading(false)
      setError("Supabase is not configured. Please add your environment variables.")
    }
  }, [refreshDocumentsFlag])

  const createTable = async () => {
    try {
      const supabase = getSupabaseClient()

      // Try to create the table
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS public.documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can view their own documents" ON public.documents
            FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY IF NOT EXISTS "Users can insert their own documents" ON public.documents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY IF NOT EXISTS "Users can update their own documents" ON public.documents
            FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY IF NOT EXISTS "Users can delete their own documents" ON public.documents
            FOR DELETE USING (auth.uid() = user_id);
        `,
      })

      if (error) {
        console.error("Error creating table:", error)
        setError("Failed to create database table. Please set up the table manually in Supabase.")
      } else {
        setNeedsSetup(false)
        setError("")
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error creating table:", error)
      setError("Failed to create database table. Please set up the table manually in Supabase.")
    }
  }

  const fetchDocuments = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("documents").select("*").order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching documents:", error)

        // Check if the error is because the table doesn't exist
        if (error.message.includes('relation "public.documents" does not exist')) {
          setNeedsSetup(true)
          setError("Database table not found. Please set up the documents table.")
        } else {
          setError(`Failed to load documents: ${error.message}`)
        }
      } else {
        setDocuments(data || [])
        setError("")
        setNeedsSetup(false)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to connect to database. Please check your Supabase configuration.")
    }
    setLoading(false)
  }

  const createDocument = async () => {
    if (!newDocTitle.trim()) return

    try {
      const supabase = getSupabaseClient()

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
        setError(`Authentication error: ${userError.message}`)
        return
      }

      if (!userData.user) {
        setError("No authenticated user found. Please sign in again.")
        return
      }

      console.log("Creating document for user:", userData.user.id)

      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            title: newDocTitle,
            content: "",
            user_id: userData.user.id,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating document:", error)
        if (error.message.includes('relation "public.documents" does not exist')) {
          setNeedsSetup(true)
          setError("Database table not found. Please set up the documents table.")
        } else {
          setError(`Failed to create document: ${error.message}`)
        }
      } else {
        console.log("Document created successfully:", data)
        setDocuments([data, ...documents])
        setNewDocTitle("")
        setShowNewDocDialog(false)
        setError("")
        onNewDocument(data)
      }
    } catch (error) {
      console.error("Error creating document:", error)
      setError("Failed to create document. Please try again.")
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("documents").delete().eq("id", id)

      if (error) {
        console.error("Error deleting document:", error)
        setError(`Failed to delete document: ${error.message}`)
      } else {
        setDocuments(documents.filter((doc) => doc.id !== id))
        setError("")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      setError("Failed to delete document. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">My Documents</CardTitle>
          {!needsSetup && (
            <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Document title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createDocument()}
                  />
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewDocDialog(false)
                        setError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createDocument} disabled={!newDocTitle.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {needsSetup && (
          <div className="p-4 border-b">
            <Alert className="border-blue-200 bg-blue-50">
              <Database className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p>
                    <strong>Database Setup Required</strong>
                  </p>
                  <p className="text-sm">The documents table needs to be created in your Supabase database.</p>
                  <div className="mt-3">
                    <Button size="sm" onClick={createTable} className="mr-2">
                      Auto Setup
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNeedsSetup(false)}>
                      Manual Setup
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {error && !showNewDocDialog && !needsSetup && (
          <div className="p-4 border-b">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {!needsSetup && documents.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <Button variant="link" className="text-xs p-0 h-auto mt-1" onClick={() => onNewDocument({} as Document)}>
              Create your first document
            </Button>
          </div>
        ) : !needsSetup ? (
          <div className="max-h-64 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-3 border-b hover:bg-slate-50 cursor-pointer ${
                  currentDocumentId === doc.id ? "bg-emerald-50 border-emerald-200" : ""
                }`}
                onClick={() => onSelectDocument(doc)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{doc.title}</h4>
                  <p className="text-xs text-slate-500">{formatDate(doc.updated_at)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectDocument(doc)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteDocument(doc.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
