"use client"

import { useState } from "react"
import { useEditor, EditorContent, FloatingMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Document } from "@/lib/types"
import { useDebouncedCallback } from "use-debounce"
import { FloatingToolbar } from "./editor/floating-toolbar"
import { DocumentActions } from "./editor/document-actions"
import { DocumentSwitcherDialog } from "./editor/document-switcher-dialog"

interface TextEditorProps {
  initialDocument: Document
  onSave: (document: Document) => void
  onDelete: (documentId: string) => void
  onNew: () => void
  onSelect: (document: Document) => void
}

export function TextEditor({
  initialDocument,
  onSave,
  onDelete,
  onNew,
  onSelect,
}: TextEditorProps) {
  const [title, setTitle] = useState(initialDocument.title)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialDocument.content,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none mx-auto p-6 text-lg focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(title, editor.getHTML())
    },
  })

  const debouncedSave = useDebouncedCallback(async (newTitle: string, newContent: string) => {
    setIsSaving(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("documents")
        .update({
        title: newTitle,
        content: newContent,
        updated_at: new Date().toISOString(),
        })
      .eq("id", initialDocument.id)
        .select()
        .single()

      if (error) {
        console.error("Error saving document:", error)
      // Handle error
    } else if (data) {
      onSave(data)
    }
    setIsSaving(false)
  }, 1500)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (editor) {
      debouncedSave(e.target.value, editor.getHTML())
    }
  }

  if (!editor) {
        return null
  }

  return (
    <div className="flex h-full flex-col relative">
      <div className="flex items-center gap-4 border-b p-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="flex-1 bg-transparent text-2xl font-bold outline-none"
        />
        <DocumentActions
          onNew={onNew}
          onSave={() => debouncedSave(title, editor.getHTML())}
          onDelete={() => onDelete(initialDocument.id)}
          onSwitch={() => setIsSwitching(true)}
          isSaving={isSaving}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {editor && (
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <FloatingToolbar editor={editor} />
          </FloatingMenu>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>
      <DocumentSwitcherDialog
        open={isSwitching}
        onOpenChange={setIsSwitching}
        onSelectDocument={onSelect}
        currentDocumentId={initialDocument.id}
      />
    </div>
  )
}
