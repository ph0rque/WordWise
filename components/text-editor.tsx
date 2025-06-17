"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  FileText,
  BarChart3,
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
import { checkAIAvailability, performGrammarCheck } from "@/lib/client-grammar-checker"
import {
  generateSuggestionId,
  shouldFilterSuggestion,
  applySuggestionToText,
  updateSuggestionPositions,
  cleanupInvalidSuggestions,
} from "@/lib/suggestion-utils"
import type {
  Suggestion,
  SuggestionType,
  SuggestionAction,
  Document,
  User as SupabaseUser,
  GrammarCheckSettings,
} from "@/lib/types"
import { SuggestionCard } from "@/components/suggestion-card"
import { TextStats } from "@/components/text-stats"

interface TextEditorProps {
  user: SupabaseUser
  onSignOut: () => void
  refreshDocuments: () => void
  currentDocument: Document | null
  setCurrentDocument: (doc: Document | null) => void
  onSuggestionsPanelPropsChange?: (props: any) => void
}

export function TextEditor({ user, onSignOut, refreshDocuments, currentDocument, setCurrentDocument, onSuggestionsPanelPropsChange }: TextEditorProps) {
  const [text, setText] = useState<string>("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [recentActions, setRecentActions] = useState<SuggestionAction[]>([])
  const [activeTab, setActiveTab] = useState<string>("editor")
  const [documentTitle, setDocumentTitle] = useState<string>("Untitled Document")
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string>("")
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [lastCheckedText, setLastCheckedText] = useState<string>("")
  const [manualCheckRequested, setManualCheckRequested] = useState(false)
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isClient, setIsClient] = useState(false)

  const [settings, setSettings] = useState<GrammarCheckSettings>({
    enableAI: false,
    checkGrammar: true,
    checkSpelling: true,
    checkStyle: true,
    checkClarity: true,
    checkTone: false,
  })

  // Check AI availability on mount
  useEffect(() => {
    const checkAI = async () => {
      const available = await checkAIAvailability()
      console.log("AI availability check result:", available)
      setAiAvailable(available)
      if (available) {
        setSettings((prev) => ({ ...prev, enableAI: true }))
      }
    }
    checkAI()
  }, [])

  // Clean up old actions periodically and validate suggestions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      setRecentActions(
        (prev) => prev.filter((action) => now - action.timestamp < 60000), // Keep for 1 minute
      )

      // Clean up invalid suggestions
      setSuggestions((prev) => cleanupInvalidSuggestions(prev, text))
    }, 30000) // Clean up every 30 seconds

    return () => clearInterval(cleanup)
  }, [text])

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

  const performGrammarCheckLocal = useCallback(
    async (textToCheck: string, forceCheck = false) => {
      if (!textToCheck.trim() || textToCheck.length < 10) {
        setSuggestions([])
        setLastCheckedText("")
        return
      }

      // Don't recheck if text hasn't changed significantly and no manual check was requested
      if (!forceCheck && !manualCheckRequested) {
        const textDiff = Math.abs(textToCheck.length - lastCheckedText.length)
        const hasSignificantChange = textDiff > 10 || textToCheck.trim() !== lastCheckedText.trim()

        if (!hasSignificantChange) {
          console.log("Skipping grammar check - no significant changes")
          return
        }
      }

      setIsCheckingGrammar(true)
      setManualCheckRequested(false)

      try {
        console.log("Performing grammar check...")
        const result = await performGrammarCheck(textToCheck, settings)

        // Add unique IDs to suggestions and filter based on recent actions
        const suggestionsWithIds = result.suggestions.map((suggestion) => ({
          ...suggestion,
          id: generateSuggestionId(suggestion),
        }))

        // Filter out suggestions that were recently acted upon
        const filteredSuggestions = suggestionsWithIds.filter(
          (suggestion) => !shouldFilterSuggestion(suggestion, recentActions, textToCheck),
        )

        console.log(
          `Grammar check complete: ${result.suggestions.length} total, ${filteredSuggestions.length} after filtering`,
        )

        setSuggestions(filteredSuggestions)
        setLastCheckedText(textToCheck)
      } catch (error) {
        console.error("Grammar check failed:", error)
        // Fallback to basic checking
        const basicResults = checkGrammar(textToCheck)
        const basicWithIds = basicResults.map((suggestion) => ({
          ...suggestion,
          id: generateSuggestionId(suggestion),
        }))
        setSuggestions(basicWithIds)
        setLastCheckedText(textToCheck)
      } finally {
        setIsCheckingGrammar(false)
      }
    },
    [settings, recentActions, lastCheckedText, manualCheckRequested],
  )

  useEffect(() => {
    // Clear any existing timeout
    if (grammarCheckTimeoutRef.current) {
      clearTimeout(grammarCheckTimeoutRef.current)
    }

    // Debounce the grammar check
    grammarCheckTimeoutRef.current = setTimeout(() => {
      performGrammarCheckLocal(text, false)
    }, 1500) // Increased delay to reduce API calls

    return () => {
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current)
      }
    }
  }, [text, performGrammarCheckLocal])

  // Auto-save functionality
  useEffect(() => {
    if (currentDocument && (text !== currentDocument.content || documentTitle !== currentDocument.title)) {
      const timer = setTimeout(() => {
        saveDocument()
      }, 2000)

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
          if (error.code === "PGRST116") {
            console.log("No documents found, creating first document")
            await createNewDocument()
          } else {
            console.error("Error loading document:", error)
            setError(`Failed to load documents: ${error.message}`)
          }
        } else {
          console.log("Loading document:", data)
          setCurrentDocument(data)
          setDocumentTitle(data.title)
          setText(data.content)
          setLastCheckedText(data.content) // Initialize last checked text
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

    console.log("Save attempt - Current state:", {
      currentTitle: currentDocument.title,
      newTitle: documentTitle,
      currentContent: currentDocument.content,
      newContent: text,
      hasTitleChanged: documentTitle !== currentDocument.title,
      hasContentChanged: text !== currentDocument.content
    })

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
        refreshDocuments()
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
        setLastCheckedText("") // Reset last checked text
        setSuggestions([]) // Clear suggestions
        setRecentActions([]) // Clear recent actions
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
    setLastCheckedText(document.content) // Set last checked text
    setLastSaved(null)
    setSuggestions([]) // Clear suggestions when switching documents
    setRecentActions([]) // Clear recent actions
    setError("")
  }

  const applySuggestion = useCallback((suggestion: Suggestion) => {
    console.log("Applying suggestion:", suggestion)

    setText((prevText) => {
      const result = applySuggestionToText(prevText, suggestion)
      if (result.success) {
        const lengthDelta = suggestion.suggestedText.length - suggestion.originalText.length

        // Update positions of remaining suggestions
        setSuggestions((prevSuggestions) => {
          const updatedSuggestions = updateSuggestionPositions(
            prevSuggestions.filter((s) => s.id !== suggestion.id),
            suggestion.position,
            lengthDelta,
          )
          return updatedSuggestions
        })

        // Record the action
        setRecentActions((prev) => [
          ...prev,
          {
            suggestionId: suggestion.id || generateSuggestionId(suggestion),
            action: "applied",
            originalText: suggestion.originalText,
            position: suggestion.position,
            timestamp: Date.now(),
          },
        ])

        setError("")
        return result.newText
      } else {
        console.warn("Failed to apply suggestion:", result.error)
        // Don't show error to user for "already changed" cases
        if (result.error?.includes("not found") || result.error?.includes("already been changed")) {
          setSuggestions((prevSuggestions) => prevSuggestions.filter((s) => s.id !== suggestion.id))
          console.log("Suggestion removed - text appears to have been already modified")
        } else {
          setError(`Failed to apply suggestion: ${result.error}`)
          setTimeout(() => {
            setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
            setError("")
          }, 3000)
        }
        return prevText
      }
    })
  }, [setText, setSuggestions, setRecentActions, setError])

  const ignoreSuggestion = useCallback((suggestion: Suggestion) => {
    console.log("Ignoring suggestion:", suggestion)

    // Remove the suggestion from the list
    setSuggestions(suggestions.filter((s) => s.id !== suggestion.id))

    // Record the action
    const action: SuggestionAction = {
      suggestionId: suggestion.id || generateSuggestionId(suggestion),
      action: "ignored",
      originalText: suggestion.originalText,
      position: suggestion.position,
      timestamp: Date.now(),
    }
    setRecentActions((prev) => [...prev, action])
  }, [suggestions, recentActions])

  const getIconForType = useCallback((type: SuggestionType) => {
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
  }, [])

  const manualGrammarCheck = () => {
    console.log("Manual grammar check requested")
    setManualCheckRequested(true)
    setRecentActions([]) // Clear recent actions to allow re-checking
    performGrammarCheckLocal(text, true)
  }

  const getSuggestionCount = (type: SuggestionType) => {
    return suggestions.filter((s) => s.type === type).length
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

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (onSuggestionsPanelPropsChange) {
      onSuggestionsPanelPropsChange({
        suggestions,
        aiAvailable,
        isCheckingGrammar,
        settings,
        applySuggestion,
        ignoreSuggestion,
        getIconForType,
      })
    }
  }, [suggestions, aiAvailable, isCheckingGrammar, settings, applySuggestion, ignoreSuggestion, getIconForType])

  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title)
    }
  }, [currentDocument])

  useEffect(() => {
    if (currentDocument) {
      setText(currentDocument.content)
    }
  }, [currentDocument])

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
            <strong>Basic Mode:</strong> Using pattern-based grammar checking. AI-powered analysis is not available.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">WordWise</h1>
          <p className="mt-1 text-slate-600">Write with confidence. Edit with intelligence.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Editor - Takes up 2/3 of the screen */}
        <div className="lg:col-span-1">
          {/* Document Title */}
          <h1 className="text-2xl font-bold mb-4">
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Document title"
            />
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="editor">
                  <FileText className="w-4 h-4 mr-1" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Performance
                </TabsTrigger>
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

              {/* Save section below text box */}
              <div className="flex items-center gap-4 mt-4">
                <Button variant="outline" size="sm" onClick={saveDocument} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {saving && <span>Saving...</span>}
                  {isClient && lastSaved && !saving && <span className="italic">Saved {lastSaved.toLocaleTimeString()}</span>}
                </div>
              </div>
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
                        {aiAvailable ? "Use ChatGPT for advanced grammar analysis" : "AI features are not available"}
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
                        AI-powered checking is not available. Using basic pattern-based grammar checking.
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

                  <Button onClick={manualGrammarCheck} disabled={isCheckingGrammar} className="w-full">
                    {isCheckingGrammar ? "Checking..." : "Re-check Document"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export function SuggestionsPanel({
  suggestions = [],
  aiAvailable = false,
  isCheckingGrammar = false,
  settings = {
    enableAI: false,
    checkGrammar: true,
    checkSpelling: true,
    checkStyle: true,
    checkClarity: true,
    checkTone: false,
  },
  applySuggestion = () => {},
  ignoreSuggestion = () => {},
  getIconForType = () => null,
}: {
  suggestions?: Suggestion[];
  aiAvailable?: boolean;
  isCheckingGrammar?: boolean;
  settings?: GrammarCheckSettings;
  applySuggestion?: (suggestion: Suggestion) => void;
  ignoreSuggestion?: (suggestion: Suggestion) => void;
  getIconForType?: (type: SuggestionType) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">
        Suggestions {!aiAvailable && <span className="text-sm text-slate-400">(Basic Mode)</span>}
      </h2>
      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id || index}
              suggestion={suggestion}
              onApply={() => applySuggestion(suggestion)}
              onIgnore={() => ignoreSuggestion(suggestion)}
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
            ) : suggestions.length === 0 && (
              <div className="py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                <p className="text-slate-600">Your text looks great!</p>
                <p className="text-sm text-slate-500 mt-1">No issues detected.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function useSuggestionsPanelProps({
  suggestions,
  aiAvailable,
  isCheckingGrammar,
  settings,
  applySuggestion,
  ignoreSuggestion,
  getIconForType,
}: any) {
  return {
    suggestions,
    aiAvailable,
    isCheckingGrammar,
    settings,
    applySuggestion,
    ignoreSuggestion,
    getIconForType,
  };
}
