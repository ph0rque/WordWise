"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Save, User, LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getSupabaseClient } from "@/lib/supabase/client"
import { checkGrammar } from "@/lib/grammar-checker"
import type { Suggestion, SuggestionType, Document, User as SupabaseUser } from "@/lib/types"
import { SuggestionCard } from "@/components/suggestion-card"
import { TextStats } from "@/components/text-stats"
import { DocumentManager } from "@/components/document-manager"

interface TextEditorProps {
  user: SupabaseUser
  onSignOut: () => void
}

export function TextEditor({ user, onSignOut }: TextEditorProps) {
  const [text, setText] = useState<string>("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeTab, setActiveTab] = useState<string>("editor")
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string>("Untitled Document")
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    // Suppress ResizeObserver errors
    const resizeObserverErrorHandler = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.stopImmediatePropagation()
      }
    }

    window.addEventListener("error", resizeObserverErrorHandler)

    return () => {
      window.removeEventListener("error", resizeObserverErrorHandler)
    }
  }, [])

  useEffect(() => {
    // Debounce the grammar check to avoid checking on every keystroke
    const timer = setTimeout(() => {
      if (text.trim()) {
        const results = checkGrammar(text)
        setSuggestions(results)
      } else {
        setSuggestions([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [text])

  // Auto-save functionality
  useEffect(() => {
    if (currentDocument && text !== currentDocument.content && text.trim() !== "") {
      const timer = setTimeout(() => {
        saveDocument()
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer)
    }
  }, [text, currentDocument, documentTitle])

  // Load user's most recent document on mount
  useEffect(() => {
    const loadInitialDocument = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single()

        if (error) {
          // If no documents exist, create a new one
          if (error.code === "PGRST116") {
            await createNewDocument()
          } else {
            console.error("Error loading document:", error)
          }
        } else {
          // Load the most recent document
          setCurrentDocument(data)
          setDocumentTitle(data.title)
          setText(data.content)
        }
      } catch (error) {
        console.error("Error initializing document:", error)
      }
    }

    loadInitialDocument()
  }, [user.id])

  const saveDocument = async () => {
    if (!currentDocument) {
      console.log("No current document to save")
      return
    }

    // Don't save if nothing has changed
    if (text === currentDocument.content && documentTitle === currentDocument.title) {
      console.log("No changes to save")
      return
    }

    setSaving(true)
    console.log("Saving document:", { id: currentDocument.id, title: documentTitle, contentLength: text.length })

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("documents")
        .update({
          title: documentTitle,
          content: text,
        })
        .eq("id", currentDocument.id)
        .select()
        .single()

      if (error) {
        console.error("Error saving document:", error)
      } else {
        console.log("Document saved successfully:", data)
        setLastSaved(new Date())
        setCurrentDocument({ ...currentDocument, title: documentTitle, content: text })
      }
    } catch (error) {
      console.error("Error saving document:", error)
    }
    setSaving(false)
  }

  const createNewDocument = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            title: "Untitled Document",
            content: "",
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating document:", error)
      } else {
        setCurrentDocument(data)
        setDocumentTitle(data.title)
        setText(data.content)
      }
    } catch (error) {
      console.error("Error creating document:", error)
    }
  }

  const selectDocument = (document: Document) => {
    console.log("Selecting document:", document)
    setCurrentDocument(document)
    setDocumentTitle(document.title)
    setText(document.content)
    setLastSaved(null) // Reset last saved time when switching documents
  }

  const applySuggestion = (suggestion: Suggestion) => {
    const before = text.substring(0, suggestion.position)
    const after = text.substring(suggestion.position + suggestion.originalText.length)
    setText(before + suggestion.suggestedText + after)

    // Remove the applied suggestion
    setSuggestions(
      suggestions.filter((s) => !(s.position === suggestion.position && s.originalText === suggestion.originalText)),
    )
  }

  const getSuggestionCount = (type: SuggestionType) => {
    return suggestions.filter((s) => s.type === type).length
  }

  const getIconForType = (type: SuggestionType) => {
    switch (type) {
      case "grammar":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "spelling":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "style":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="text-lg font-medium border-none shadow-none p-0 h-auto focus-visible:ring-0"
            placeholder="Document title"
          />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {saving && <span>Saving...</span>}
            {lastSaved && !saving && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
            <Button variant="outline" size="sm" onClick={saveDocument} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              {user.email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_2fr_1fr]">
        {/* Document Manager */}
        <div>
          <DocumentManager
            onSelectDocument={selectDocument}
            onNewDocument={createNewDocument}
            currentDocumentId={currentDocument?.id}
          />
        </div>

        {/* Editor */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {getSuggestionCount("grammar") > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {getSuggestionCount("grammar")}
                  </Badge>
                )}
                {getSuggestionCount("spelling") > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-700">
                    <AlertTriangle className="w-3 h-3" />
                    {getSuggestionCount("spelling")}
                  </Badge>
                )}
                {getSuggestionCount("style") > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
                    <Info className="w-3 h-3" />
                    {getSuggestionCount("style")}
                  </Badge>
                )}
                {suggestions.length === 0 && text.length > 20 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    All good
                  </Badge>
                )}
              </div>
            </div>

            <TabsContent value="editor" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Start typing here... We'll check your grammar, spelling, and style."
                    className="min-h-[400px] border-none focus-visible:ring-0 resize-none text-base"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ resize: "none" }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <TextStats text={text} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Suggestions</h2>
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onApply={() => applySuggestion(suggestion)}
                  icon={getIconForType(suggestion.type)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                {text.length > 20 ? (
                  <div className="py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                    <p className="text-slate-600">Your text looks good!</p>
                    <p className="text-sm text-slate-500 mt-1">No issues detected.</p>
                  </div>
                ) : (
                  <div className="py-8">
                    <Info className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600">Start typing to see suggestions</p>
                    <p className="text-sm text-slate-500 mt-1">We'll analyze your text as you write.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
