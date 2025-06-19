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
  BookOpen,
  TrendingUp,
  Bot,
  GraduationCap,
  PenTool,
  Target,
  Clock,
  Bookmark,
  List,
  Quote,
  AlignLeft,
  Type,
  Palette,
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
  enhancedGrammarCheck, 
  isAcademicGrammarAvailable,
  type AcademicGrammarCheckOptions 
} from "@/lib/client-academic-grammar-checker"
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
import ReadabilityDashboard from "@/components/analysis/readability-dashboard"
import VocabularyEnhancer from "@/components/analysis/vocabulary-enhancer"
import { ChatPanel } from "@/components/tutor/chat-panel"
import { RecordingControls } from "@/components/keystroke/recording-controls"

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
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const [settings, setSettings] = useState<GrammarCheckSettings>({
    enableAI: false,
    checkGrammar: true,
    checkSpelling: true,
    checkStyle: true,
    checkClarity: true,
    checkTone: false,
  })

  // Academic grammar checking settings
  const [academicSettings, setAcademicSettings] = useState<AcademicGrammarCheckOptions & {
    enableAcademicMode: boolean
  }>({
    enableAcademicMode: true,
    academicLevel: 'high-school',
    subject: undefined,
  })

  const [academicAvailable, setAcademicAvailable] = useState(false)
  const [academicAssessment, setAcademicAssessment] = useState<{
    score: number
    level: 'below-standard' | 'developing' | 'proficient' | 'advanced'
    feedback: string[]
  } | null>(null)

  // Student-focused UI state
  const [writingMode, setWritingMode] = useState<'draft' | 'revision' | 'final'>('draft')
  const [showEssayStructure, setShowEssayStructure] = useState(false)
  const [showAcademicTools, setShowAcademicTools] = useState(true)
  const [activeWritingGoal, setActiveWritingGoal] = useState<{
    type: 'word_count' | 'time' | 'paragraph_count'
    target: number
    current: number
  } | null>(null)

  // Check AI availability on mount
  useEffect(() => {
    const checkAI = async () => {
      const available = await checkAIAvailability()
      const academicAvail = await isAcademicGrammarAvailable()
      console.log("AI availability check result:", available)
      console.log("Academic grammar availability check result:", academicAvail)
      setAiAvailable(available)
      setAcademicAvailable(academicAvail)
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
        console.log("Performing enhanced grammar check...")
        
        // Use enhanced academic grammar check if available and enabled
        const useAcademicMode = academicAvailable && academicSettings.enableAcademicMode
        
        let result
        if (useAcademicMode) {
          result = await enhancedGrammarCheck(textToCheck, academicSettings)
          // Update academic assessment if available
          if (result.academicAssessment) {
            setAcademicAssessment(result.academicAssessment)
          }
        } else {
          // Fallback to regular grammar check
          const basicResult = await performGrammarCheck(textToCheck, settings)
          result = { suggestions: basicResult.suggestions }
        }

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
          useAcademicMode ? "(Academic mode)" : "(Basic mode)"
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
      case "academic-style":
        return "default"
      case "vocabulary":
        return "secondary"
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
      case "academic-style":
        return "border-indigo-500 text-indigo-700"
      case "vocabulary":
        return "border-teal-500 text-teal-700"
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

  // Student-friendly writing tools
  const insertEssayStructure = (type: 'five-paragraph' | 'argumentative' | 'analytical') => {
    const structures = {
      'five-paragraph': `Introduction
• Hook: 
• Background information: 
• Thesis statement: 

Body Paragraph 1
• Topic sentence: 
• Evidence: 
• Analysis: 
• Connection to thesis: 

Body Paragraph 2
• Topic sentence: 
• Evidence: 
• Analysis: 
• Connection to thesis: 

Body Paragraph 3
• Topic sentence: 
• Evidence: 
• Analysis: 
• Connection to thesis: 

Conclusion
• Restate thesis: 
• Summarize main points: 
• Closing thought/call to action: `,

      'argumentative': `Introduction
• Attention grabber: 
• Background context: 
• Clear thesis statement with your position: 

Argument 1 (Strongest)
• Claim: 
• Evidence (facts, statistics, quotes): 
• Explanation of how evidence supports claim: 

Argument 2
• Claim: 
• Evidence: 
• Explanation: 

Counter-argument & Rebuttal
• Opposing viewpoint: 
• Why this view exists: 
• Your response/refutation: 

Conclusion
• Restate your position: 
• Summary of key arguments: 
• Final persuasive appeal: `,

      'analytical': `Introduction
• Background on text/topic: 
• Your analytical thesis (what you'll analyze): 

Analysis Point 1
• What you're analyzing: 
• Evidence from text: 
• Your interpretation/analysis: 
• Significance: 

Analysis Point 2
• What you're analyzing: 
• Evidence from text: 
• Your interpretation/analysis: 
• Significance: 

Analysis Point 3
• What you're analyzing: 
• Evidence from text: 
• Your interpretation/analysis: 
• Significance: 

Conclusion
• Synthesis of your analysis: 
• Broader implications: `
    }
    
    const newText = text + '\n\n' + structures[type]
    setText(newText)
    setActiveTab('editor')
  }

  const insertAcademicPhrase = (phrase: string) => {
    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.substring(0, start) + phrase + text.substring(end)
    setText(newText)
    
    // Set cursor position after inserted phrase
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + phrase.length, start + phrase.length)
    }, 0)
  }

  const academicPhrases = {
    'transitions': [
      'Furthermore, ',
      'Moreover, ',
      'In addition to this, ',
      'Consequently, ',
      'However, ',
      'Nevertheless, ',
      'On the contrary, ',
      'In contrast, ',
      'Similarly, ',
      'Likewise, '
    ],
    'analysis': [
      'This evidence suggests that ',
      'The author\'s use of ',
      'This demonstrates ',
      'The significance of this is ',
      'This reveals ',
      'The implication is that ',
      'This supports the argument that ',
      'The data indicates that '
    ],
    'citing': [
      'According to ',
      'As stated in ',
      'The author argues that ',
      'Research shows that ',
      'Studies indicate that ',
      'Evidence suggests that ',
      'Experts claim that '
    ]
  }

  // Writing goal tracking
  const updateWritingGoal = () => {
    if (!activeWritingGoal) return
    
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length
    
    let current = 0
    switch (activeWritingGoal.type) {
      case 'word_count':
        current = wordCount
        break
      case 'paragraph_count':
        current = paragraphCount
        break
      case 'time':
        // Time tracking would need additional state management
        break
    }
    
    setActiveWritingGoal(prev => prev ? { ...prev, current } : null)
  }

  useEffect(() => {
    updateWritingGoal()
  }, [text])

  return (
    <div className="min-h-screen bg-background">
      {/* Student-friendly header with writing mode toggle */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WordWise - Academic Writing Assistant
                </h1>
              </div>
              
              {/* Writing Mode Toggle */}
              <div className="flex items-center space-x-1 bg-white/50 dark:bg-black/20 rounded-lg p-1">
                {(['draft', 'revision', 'final'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setWritingMode(mode)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      writingMode === mode
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* User menu and writing goal */}
            <div className="flex items-center space-x-4">
              {activeWritingGoal && (
                <div className="flex items-center space-x-2 bg-white/60 dark:bg-black/30 rounded-lg px-3 py-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {activeWritingGoal.current}/{activeWritingGoal.target} {
                      activeWritingGoal.type === 'word_count' ? 'words' :
                      activeWritingGoal.type === 'paragraph_count' ? 'paragraphs' : 'minutes'
                    }
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (activeWritingGoal.current / activeWritingGoal.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Academic Writing Tools Sidebar */}
          {showAcademicTools && (
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Academic Tools</h3>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  
                  {/* Essay Structure Templates */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Essay Templates</h4>
                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertEssayStructure('five-paragraph')}
                        className="justify-start text-xs"
                      >
                        <List className="h-3 w-3 mr-1" />
                        5-Paragraph Essay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertEssayStructure('argumentative')}
                        className="justify-start text-xs"
                      >
                        <PenTool className="h-3 w-3 mr-1" />
                        Argumentative Essay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertEssayStructure('analytical')}
                        className="justify-start text-xs"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analytical Essay
                      </Button>
                    </div>
                  </div>

                  {/* Academic Phrases */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Academic Phrases</h4>
                    <div className="space-y-2">
                      {Object.entries(academicPhrases).map(([category, phrases]) => (
                        <DropdownMenu key={category}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                              <Quote className="h-3 w-3 mr-1" />
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            {phrases.map((phrase, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => insertAcademicPhrase(phrase)}
                                className="text-xs"
                              >
                                {phrase}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}
                    </div>
                  </div>

                  {/* Writing Goals */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Writing Goals</h4>
                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveWritingGoal({ type: 'word_count', target: 500, current: 0 })}
                        className="justify-start text-xs"
                      >
                        <Target className="h-3 w-3 mr-1" />
                        500 Words
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveWritingGoal({ type: 'paragraph_count', target: 5, current: 0 })}
                        className="justify-start text-xs"
                      >
                        <AlignLeft className="h-3 w-3 mr-1" />
                        5 Paragraphs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Editor Area */}
          <div className={showAcademicTools ? "lg:col-span-3" : "lg:col-span-4"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="editor" className="flex items-center space-x-1">
                  <PenTool className="h-4 w-4" />
                  <span className="hidden sm:inline">Write</span>
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center space-x-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Suggestions</span>
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {suggestions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="readability" className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="vocabulary" className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Vocabulary</span>
                </TabsTrigger>
                <TabsTrigger value="tutor" className="flex items-center space-x-1">
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Tutor</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
              </TabsList>

              {/* Rest of the existing tabs content */}
              <TabsContent value="editor" className="space-y-4">
                {/* Document header with enhanced styling */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <Input
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className="font-semibold bg-transparent border-none text-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter document title..."
                      />
                    </div>
                    
                    {/* Writing mode indicator */}
                    <Badge variant="outline" className="text-xs">
                      {writingMode} mode
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    {saving && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Saving...</span>
                      </div>
                    )}
                    {lastSaved && !saving && (
                      <div className="text-xs text-gray-500">
                        Saved {lastSaved.toLocaleTimeString()}
                      </div>
                    )}
                    <Button onClick={saveDocument} size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* Academic writing mode indicator */}
                {academicSettings.enableAcademicMode && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                    <GraduationCap className="h-4 w-4" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Academic writing mode is active for {academicSettings.academicLevel} level.
                      {academicAssessment && (
                        <span className="ml-2 font-medium">
                          Current score: {academicAssessment.score}/100 ({academicAssessment.level})
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Enhanced text editor */}
                <Card className="relative">
                  <CardContent className="p-0">
                    <Textarea
                      ref={textAreaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`Start writing your ${writingMode === 'draft' ? 'first draft' : writingMode === 'revision' ? 'revised version' : 'final essay'}...

Tips for ${writingMode} mode:
${writingMode === 'draft' ? '• Focus on getting your ideas down\n• Don\'t worry about perfect grammar yet\n• Use the essay templates to structure your thoughts' : 
  writingMode === 'revision' ? '• Review your argument structure\n• Check for clarity and flow\n• Use academic phrases to strengthen your writing' : 
  '• Proofread carefully\n• Check citations and formatting\n• Ensure your thesis is clearly supported'}`}
                      className="min-h-[500px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 p-6"
                      style={{ fontSize: '16px', lineHeight: '1.6' }}
                    />
                    
                    {/* Keystroke recording controls */}
                    <div className="absolute bottom-4 right-4">
                      <RecordingControls />
                    </div>
                  </CardContent>
                </Card>

                {/* Writing tips based on mode */}
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          {writingMode === 'draft' ? 'Drafting Tips' : 
                           writingMode === 'revision' ? 'Revision Tips' : 'Final Review Tips'}
                        </h4>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {writingMode === 'draft' && (
                            <>
                              <li>• Start with an outline or use our essay templates</li>
                              <li>• Focus on expressing your ideas clearly</li>
                              <li>• Don't stop to fix every grammar error - keep writing!</li>
                            </>
                          )}
                          {writingMode === 'revision' && (
                            <>
                              <li>• Read your essay aloud to check flow</li>
                              <li>• Make sure each paragraph supports your thesis</li>
                              <li>• Use transition phrases to connect ideas</li>
                            </>
                          )}
                          {writingMode === 'final' && (
                            <>
                              <li>• Check all grammar and spelling suggestions</li>
                              <li>• Verify your citations are properly formatted</li>
                              <li>• Read through one more time for clarity</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rest of existing tab content remains the same */}
              {/* ... existing TabsContent for suggestions, readability, vocabulary, tutor, stats ... */}
            </Tabs>
          </div>
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
              key={suggestion.id || `${suggestion.type}-${suggestion.position}-${suggestion.originalText}-${suggestion.suggestedText}-${index}`}
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
