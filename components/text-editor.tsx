"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  User,
  LogOut,
  Lightbulb,
  Zap,
  Settings,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase/client"
import { checkGrammar } from "@/lib/grammar-checker"
import { checkGrammarWithAI, isOpenAIAvailable } from "@/lib/openai-grammar-checker"
import type { Suggestion, SuggestionType, Document, User as SupabaseUser, GrammarCheckSettings } from "@/lib/types"
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
  const [error, setError] = useState<string>("")
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [settings, setSettings] = useState<GrammarCheckSettings>({
    enableAI: false, // Default to false until we confirm AI is available
    checkGrammar: true,
    checkSpelling: true,
    checkStyle: true,
    checkClarity: true,
    checkTone: false,
  })

  // Check AI availability on mount
  useEffect(() => {
    const checkAI = () => {
      const available = isOpenAIAvailable()
      console.log("AI availability check result:", available)
      setAiAvailable(available)
      // Only enable AI if it's actually available
      if (available) {
        setSettings((prev) => ({ ...prev, enableAI: true }))
      }
    }
    checkAI()
  }, [])

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

  const performGrammarCheck = useCallback(
    async (textToCheck: string) => {
      if (!textToCheck.trim() || textToCheck.length < 10) {
        setSuggestions([])
        return
      }

      setIsCheckingGrammar(true)

      try {
        let results: Suggestion[] = []

        // Only use AI if both settings allow it AND AI is actually available
        if (settings.enableAI && aiAvailable) {
          console.log("Using AI grammar checking")
          results = await checkGrammarWithAI(textToCheck)
        } else {
          console.log("Using basic grammar checking")
          results = checkGrammar(textToCheck)
        }

        // Filter suggestions based on settings
        const filteredResults = results.filter((suggestion) => {
          switch (suggestion.type) {
            case "grammar":
              return settings.checkGrammar
            case "spelling":
              return settings.checkSpelling
            case "style":
              return settings.checkStyle
            case "clarity":
              return settings.checkClarity
            case "tone":
              return settings.checkTone
            default:
              return true
          }
        })

        setSuggestions(filteredResults)
      } catch (error) {
        console.error("Grammar check failed:", error)
        // Fallback to basic checking
        const basicResults = checkGrammar(textToCheck)
        setSuggestions(basicResults)
      } finally {
        setIsCheckingGrammar(false)
      }
    },
    [settings, aiAvailable],
  )

  useEffect(() => {
    // Debounce the grammar check to avoid checking on every keystroke
    const timer = setTimeout(() => {
      performGrammarCheck(text)
    }, 1000) // Increased delay for AI calls

    return () => clearTimeout(timer)
  }, [text, performGrammarCheck])

  // Auto-save functionality
  useEffect(() => {
    if (currentDocument && (text !== currentDocument.content || documentTitle !== currentDocument.title)) {
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
            console.log("No documents found, creating first document")
            await createNewDocument()
          } else {
            console.error("Error loading document:", error)
            setError(`Failed to load documents: ${error.message}`)
          }
        } else {
          // Load the most recent document
          console.log("Loading document:", data)
          setCurrentDocument(data)
          setDocumentTitle(data.title)
          setText(data.content)
          setError("")
        }
      } catch (error) {
        console.error("Error initializing document:", error)
        setError("Failed to initialize. Please check your Supabase configuration.")
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
    setError("")
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
        setError(`Failed to save: ${error.message}`)
      } else {
        console.log("Document saved successfully:", data)
        setLastSaved(new Date())
        setCurrentDocument({ ...currentDocument, title: documentTitle, content: text })
        setError("")
      }
    } catch (error) {
      console.error("Error saving document:", error)
      setError("Failed to save document. Please try again.")
    }
    setSaving(false)
  }

  const createNewDocument = async () => {
    try {
      const supabase = getSupabaseClient()

      console.log("Creating new document for user:", user.id)

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
        setError(`Failed to create document: ${error.message}`)
      } else {
        console.log("Document created successfully:", data)
        setCurrentDocument(data)
        setDocumentTitle(data.title)
        setText(data.content)
        setError("")
      }
    } catch (error) {
      console.error("Error creating document:", error)
      setError("Failed to create document. Please check your Supabase configuration.")
    }
  }

  const selectDocument = (document: Document) => {
    console.log("Selecting document:", document)
    setCurrentDocument(document)
    setDocumentTitle(document.title)
    setText(document.content)
    setLastSaved(null) // Reset last saved time when switching documents
    setError("")
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
      case "clarity":
        return <Lightbulb className="w-4 h-4 text-purple-500" />
      case "tone":
        return <Zap className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  const getBadgeVariant = (type: SuggestionType) => {
    switch (type) {
      case "grammar":
        return "destructive"
      case "spelling":
        return "outline"
      case "style":
        return "outline"
      case "clarity":
        return "outline"
      case "tone":
        return "outline"
      default:
        return "outline"
    }
  }

  const getBadgeColor = (type: SuggestionType) => {
    switch (type) {
      case "grammar":
        return ""
      case "spelling":
        return "border-amber-500 text-amber-700"
      case "style":
        return "border-blue-500 text-blue-700"
      case "clarity":
        return "border-purple-500 text-purple-700"
      case "tone":
        return "border-green-500 text-green-700"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* AI Status Alert */}
      {!aiAvailable && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Basic Mode:</strong> Using pattern-based grammar checking. Add your OpenAI API key to enable
            AI-powered analysis.
          </AlertDescription>
        </Alert>
      )}

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
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {isCheckingGrammar && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {settings.enableAI && aiAvailable ? "AI Checking..." : "Checking..."}
                  </Badge>
                )}
                {getSuggestionCount("grammar") > 0 && (
                  <Badge
                    variant={getBadgeVariant("grammar")}
                    className={`flex items-center gap-1 ${getBadgeColor("grammar")}`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {getSuggestionCount("grammar")}
                  </Badge>
                )}
                {getSuggestionCount("spelling") > 0 && (
                  <Badge
                    variant={getBadgeVariant("spelling")}
                    className={`flex items-center gap-1 ${getBadgeColor("spelling")}`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {getSuggestionCount("spelling")}
                  </Badge>
                )}
                {getSuggestionCount("style") > 0 && (
                  <Badge
                    variant={getBadgeVariant("style")}
                    className={`flex items-center gap-1 ${getBadgeColor("style")}`}
                  >
                    <Info className="w-3 h-3" />
                    {getSuggestionCount("style")}
                  </Badge>
                )}
                {getSuggestionCount("clarity") > 0 && (
                  <Badge
                    variant={getBadgeVariant("clarity")}
                    className={`flex items-center gap-1 ${getBadgeColor("clarity")}`}
                  >
                    <Lightbulb className="w-3 h-3" />
                    {getSuggestionCount("clarity")}
                  </Badge>
                )}
                {getSuggestionCount("tone") > 0 && (
                  <Badge
                    variant={getBadgeVariant("tone")}
                    className={`flex items-center gap-1 ${getBadgeColor("tone")}`}
                  >
                    <Zap className="w-3 h-3" />
                    {getSuggestionCount("tone")}
                  </Badge>
                )}
                {suggestions.length === 0 && text.length > 20 && !isCheckingGrammar && (
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
                    placeholder={
                      aiAvailable
                        ? "Start typing here... We'll check your grammar, spelling, and style with AI assistance."
                        : "Start typing here... We'll check your grammar, spelling, and style using pattern matching."
                    }
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

            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="text-lg font-medium">Grammar Check Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-mode">AI-Powered Checking</Label>
                      <p className="text-sm text-slate-500">
                        {aiAvailable
                          ? "Use ChatGPT for advanced grammar analysis"
                          : "OpenAI API key required for AI features"}
                      </p>
                    </div>
                    <Switch
                      id="ai-mode"
                      checked={settings.enableAI && aiAvailable}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableAI: checked }))}
                      disabled={!aiAvailable}
                    />
                  </div>

                  {!aiAvailable && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-amber-800">
                        To enable AI-powered checking, add your OpenAI API key as an environment variable:
                        <code className="block mt-1 p-1 bg-amber-100 rounded text-xs">
                          OPENAI_API_KEY=your-api-key-here
                        </code>
                        <p className="text-xs mt-1">Currently using basic pattern-based grammar checking.</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Check for:</h4>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="check-grammar">Grammar errors</Label>
                      <Switch
                        id="check-grammar"
                        checked={settings.checkGrammar}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, checkGrammar: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="check-spelling">Spelling mistakes</Label>
                      <Switch
                        id="check-spelling"
                        checked={settings.checkSpelling}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, checkSpelling: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="check-style">Style improvements</Label>
                      <Switch
                        id="check-style"
                        checked={settings.checkStyle}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, checkStyle: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="check-clarity">
                        Clarity issues {!aiAvailable && <span className="text-xs text-slate-400">(AI only)</span>}
                      </Label>
                      <Switch
                        id="check-clarity"
                        checked={settings.checkClarity && aiAvailable}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, checkClarity: checked }))}
                        disabled={!aiAvailable}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="check-tone">
                        Tone consistency {!aiAvailable && <span className="text-xs text-slate-400">(AI only)</span>}
                      </Label>
                      <Switch
                        id="check-tone"
                        checked={settings.checkTone && aiAvailable}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, checkTone: checked }))}
                        disabled={!aiAvailable}
                      />
                    </div>
                  </div>

                  <Button onClick={() => performGrammarCheck(text)} disabled={isCheckingGrammar} className="w-full">
                    {isCheckingGrammar ? "Checking..." : "Re-check Document"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            Suggestions {!aiAvailable && <span className="text-sm text-slate-400">(Basic Mode)</span>}
          </h2>
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
                {isCheckingGrammar ? (
                  <div className="py-8">
                    <div className="w-12 h-12 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-slate-600">Analyzing your text...</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {settings.enableAI && aiAvailable ? "AI is checking for improvements" : "Checking for issues"}
                    </p>
                  </div>
                ) : text.length > 20 ? (
                  <div className="py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                    <p className="text-slate-600">Your text looks great!</p>
                    <p className="text-sm text-slate-500 mt-1">No issues detected.</p>
                  </div>
                ) : (
                  <div className="py-8">
                    <Info className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600">Start typing to see suggestions</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {aiAvailable
                        ? "AI will analyze your text as you write."
                        : "Pattern matching will check your text."}
                    </p>
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
