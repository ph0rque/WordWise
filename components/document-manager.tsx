"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Plus, MoreVertical, Trash2, Edit } from "lucide-react"
import type { Document } from "@/lib/types"

interface DocumentManagerProps {
  onSelectDocument: (document: Document) => void
  onNewDocument: () => void
  currentDocumentId?: string
}

export function DocumentManager({ onSelectDocument, onNewDocument, currentDocumentId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [newDocTitle, setNewDocTitle] = useState("")
  const [showNewDocDialog, setShowNewDocDialog] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    const { data, error } = await supabase.from("documents").select("*").order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
    } else {
      setDocuments(data || [])
    }
    setLoading(false)
  }

  const createDocument = async () => {
    if (!newDocTitle.trim()) return

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          title: newDocTitle,
          content: "",
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating document:", error)
    } else {
      setDocuments([data, ...documents])
      setNewDocTitle("")
      setShowNewDocDialog(false)
      onSelectDocument(data)
    }
  }

  const deleteDocument = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) {
      console.error("Error deleting document:", error)
    } else {
      setDocuments(documents.filter((doc) => doc.id !== id))
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDocument} disabled={!newDocTitle.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <Button variant="link" className="text-xs p-0 h-auto mt-1" onClick={onNewDocument}>
              Create your first document
            </Button>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}
