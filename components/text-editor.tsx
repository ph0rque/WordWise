"use client"

import { useState, useEffect } from "react"
import { useEditor, EditorContent, FloatingMenu, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import Focus from "@tiptap/extension-focus"
import Typography from "@tiptap/extension-typography"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Document } from "@/lib/types"
import { useDebouncedCallback } from "use-debounce"
import { FloatingToolbar } from "./editor/floating-toolbar"
import { DocumentActions } from "./editor/document-actions"
import { DocumentSwitcherDialog } from "./editor/document-switcher-dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Code,
  Link,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react"

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
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return "What's the title?"
          }
          return "Start writing your thoughts here... Use \"/\" for commands or select text for formatting options."
        },
      }),
      CharacterCount.configure({
        limit: 50000, // 50k character limit for academic writing
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Typography,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: initialDocument.content,
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none mx-auto p-8 focus:outline-none min-h-[500px] leading-relaxed",
        style: "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(title, editor.getHTML())
    },
  })

  // Update editor content when document changes
  useEffect(() => {
    if (editor && initialDocument.content !== editor.getHTML()) {
      editor.commands.setContent(initialDocument.content)
    }
  }, [initialDocument.content, editor])

  // Update title when document changes
  useEffect(() => {
    setTitle(initialDocument.title)
  }, [initialDocument.title])

  const debouncedSave = useDebouncedCallback(async (newTitle: string, newContent: string) => {
    setIsSaving(true)
    try {
      const supabase = getSupabaseClient()
      
      // Get current user for security
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError || !userData.user) {
        console.error("Error getting user for document save:", userError)
        setIsSaving(false)
        return
      }

      const { data, error } = await supabase
        .from("documents")
        .update({
          title: newTitle,
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialDocument.id)
        .eq("user_id", userData.user.id) // Ensure user can only update their own documents
        .select()
        .single()

      if (error) {
        console.error("Error saving document:", error)
        // Handle error
      } else if (data) {
        onSave(data)
      }
    } catch (error) {
      console.error("Error in debouncedSave:", error)
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
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading editor...</p>
        </div>
      </div>
    )
  }

  const wordCount = editor.storage.characterCount.words()
  const characterCount = editor.storage.characterCount.characters()
  const characterLimit = editor.extensionManager.extensions.find(
    (extension) => extension.name === 'characterCount'
  )?.options?.limit

  return (
    <div className="flex h-full flex-col relative bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-gray-50/50 p-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Document title..."
          className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-gray-400"
        />
        <div className="flex items-center gap-2">
          {/* Word and character count */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className="text-xs">
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="text-xs">
              {characterCount}/{characterLimit} chars
            </Badge>
          </div>
          <DocumentActions
            onNew={onNew}
            onSave={() => debouncedSave(title, editor.getHTML())}
            onDelete={() => onDelete(initialDocument.id)}
            onSwitch={() => setIsSwitching(true)}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Bubble Menu for text selection */}
        {editor && (
          <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100, maxWidth: 'none' }}
            className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <Button
              size="sm"
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('strike') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('code') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              size="sm"
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </BubbleMenu>
        )}

        {/* Floating Menu for empty lines */}
        {editor && (
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <FloatingToolbar editor={editor} />
          </FloatingMenu>
        )}

        <EditorContent 
          editor={editor} 
          className="h-full"
        />
      </div>

      {/* Footer with stats (mobile) */}
      <div className="sm:hidden border-t bg-gray-50/50 p-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{characterCount}/{characterLimit} chars</span>
        </div>
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
