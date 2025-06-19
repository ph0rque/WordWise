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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Document</DialogTitle>
          <DialogDescription>
            Select a document to continue editing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Button
                    variant={doc.id === currentDocumentId ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleSelect(doc)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {doc.title}
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