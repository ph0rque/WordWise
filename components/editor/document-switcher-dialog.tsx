"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Document } from "@/lib/types"
import { FileText, Loader2 } from "lucide-react"

interface DocumentSwitcherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDocument: (document: Document) => void
  currentDocumentId?: string
}

export function DocumentSwitcherDialog({
  open,
  onOpenChange,
  onSelectDocument,
  currentDocumentId,
}: DocumentSwitcherDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchDocuments()
    }
  }, [open])

  async function fetchDocuments() {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
      // Handle error
    } else {
      setDocuments(data || [])
    }
    setLoading(false)
  }

  const handleSelect = (doc: Document) => {
    onSelectDocument(doc)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Switch Document</DialogTitle>
          <DialogDescription>
            Select a document to continue editing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found</p>
              <p className="text-sm text-gray-500 mt-1">Create a new document to get started</p>
            </div>
          ) : (
            <ul className="space-y-2 pr-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Button
                    variant={doc.id === currentDocumentId ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelect(doc)}
                    title={doc.title}
                  >
                    <FileText className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{doc.title || "Untitled Document"}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 