"use client"

import { Editor } from "@tiptap/react"
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Pilcrow } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

interface FloatingToolbarProps {
  editor: Editor
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
    </div>
  )
} 