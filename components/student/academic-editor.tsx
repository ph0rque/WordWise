"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  GraduationCap,
  PenTool,
  Target,
  Clock,
  List,
  Quote,
  FileText,
  Save,
  User,
  LogOut,
  Info,
  Award,
  Star,
  Type,
  Timer,
  BookOpen,
  CheckCircle2,
  Bot,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { User as SupabaseUser, Document } from "@/lib/types"
import { WritingToolsPanel } from './writing-tools-panel'
import { EssayStructureGuide } from './essay-structure-guide'
import { EssayTemplateLibrary } from './essay-template-library'
import { WritingGuideWizard } from './writing-guide-wizard'
import CitationHelper from './citation-helper'
import AcademicFormatting from './academic-formatting'
import OnboardingFlow from './onboarding-flow'
import { useOnboarding } from '@/lib/hooks/use-onboarding'
import { 
  MobileResponsiveLayout, 
  MobileTabs, 
  MobileCardGrid, 
  TouchOptimizedButton,
  useDeviceType,
  mobileSpacing 
} from './mobile-responsive-layout'
import { KeyboardShortcutsHelp, FloatingShortcutHint } from './keyboard-shortcuts-help'
import { 
  useKeyboardShortcuts, 
  createAcademicWritingShortcuts,
  getRandomPhrase,
  ACADEMIC_PHRASE_COLLECTIONS
} from '@/lib/hooks/use-keyboard-shortcuts'

interface StudentAcademicEditorProps {
  user: SupabaseUser
  onSignOut: () => void
  currentDocument: Document | null
  onSave?: (title: string, content: string) => Promise<void>
}

// Academic writing templates for high school students
const ESSAY_TEMPLATES = {
  'five-paragraph': {
    name: '5-Paragraph Essay',
    description: 'Perfect for persuasive and expository essays',
    template: `# [Your Essay Title]

## Introduction
• **Hook:** [Start with an attention-grabbing statement, question, or quote]
• **Background:** [Provide context about your topic]
• **Thesis Statement:** [State your main argument in 1-2 sentences]

## Body Paragraph 1: [Main Point #1]
• **Topic Sentence:** [Introduce your first main point]
• **Evidence:** [Provide facts, quotes, or examples]
• **Analysis:** [Explain how your evidence supports your point]
• **Connection:** [Link back to your thesis]

## Body Paragraph 2: [Main Point #2]
• **Topic Sentence:** [Introduce your second main point]
• **Evidence:** [Provide facts, quotes, or examples]
• **Analysis:** [Explain how your evidence supports your point]
• **Connection:** [Link back to your thesis]

## Body Paragraph 3: [Main Point #3]
• **Topic Sentence:** [Introduce your third main point]
• **Evidence:** [Provide facts, quotes, or examples]
• **Analysis:** [Explain how your evidence supports your point]
• **Connection:** [Link back to your thesis]

## Conclusion
• **Restate Thesis:** [Rephrase your main argument]
• **Summary:** [Briefly recap your three main points]
• **Closing Thought:** [End with a call to action or thought-provoking statement]`
  },
  'argumentative': {
    name: 'Argumentative Essay',
    description: 'Present and defend your position on a controversial topic',
    template: `# [Your Essay Title]

## Introduction
• **Attention Grabber:** [Start with a compelling statistic, quote, or scenario]
• **Background Information:** [Provide context about the controversy/issue]
• **Your Position:** [Clearly state which side you're arguing for]
• **Thesis Statement:** [Present your main argument with preview of reasons]

## Argument 1: [Your Strongest Point]
• **Claim:** [State your argument clearly]
• **Evidence:** [Provide statistics, expert opinions, or research]
• **Warrant:** [Explain why this evidence supports your claim]
• **Impact:** [Discuss the significance of this point]

## Argument 2: [Your Second Point]
• **Claim:** [State your argument clearly]
• **Evidence:** [Provide statistics, expert opinions, or research]
• **Warrant:** [Explain why this evidence supports your claim]
• **Impact:** [Discuss the significance of this point]

## Counter-argument & Rebuttal
• **Opposition's View:** [Present the strongest opposing argument fairly]
• **Why They Think This:** [Acknowledge their reasoning]
• **Your Response:** [Refute their argument with evidence]
• **Why Your View is Stronger:** [Explain why your position is better]

## Conclusion
• **Restate Position:** [Remind readers of your stance]
• **Summarize Arguments:** [Briefly review your main points]
• **Call to Action:** [What should readers do with this information?]`
  }
}

// Academic phrases for high school writing
const ACADEMIC_PHRASES = {
  'introductions': [
    'This essay will examine...',
    'The purpose of this analysis is to...',
    'This paper argues that...',
    'The following discussion will explore...',
  ],
  'transitions': [
    'Furthermore,',
    'Moreover,',
    'In addition to this,',
    'However,',
    'On the contrary,',
    'Similarly,',
  ],
  'analysis': [
    'This evidence suggests that',
    'This demonstrates',
    'The significance of this is',
    'This supports the argument that',
  ],
  'conclusions': [
    'In conclusion,',
    'To summarize,',
    'Ultimately,',
    'Therefore,',
  ]
}

// Writing goals for students
const WRITING_GOALS = [
  { type: 'word_count' as const, target: 300, label: '300 words (1 page)' },
  { type: 'word_count' as const, target: 500, label: '500 words (2 pages)' },
  { type: 'word_count' as const, target: 750, label: '750 words (3 pages)' },
  { type: 'paragraph_count' as const, target: 5, label: '5 paragraphs' },
]

export function StudentAcademicEditor({ user, onSignOut, currentDocument, onSave }: StudentAcademicEditorProps) {
  const [text, setText] = useState<string>("")
  const [documentTitle, setDocumentTitle] = useState<string>("My Essay")
  const [activeTab, setActiveTab] = useState<string>("write")
  const [writingMode, setWritingMode] = useState<'draft' | 'revision' | 'final'>('draft')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [savedCitations, setSavedCitations] = useState<any[]>([])
  const [currentFormattingStyle, setCurrentFormattingStyle] = useState<'MLA' | 'APA' | 'Chicago' | 'Custom'>('MLA')
  
  // Onboarding state
  const { 
    showOnboarding, 
    isFirstVisit, 
    completeOnboarding, 
    skipOnboarding,
    startOnboarding 
  } = useOnboarding({ userId: user.id })
  
  // Writing goals
  const [activeWritingGoal, setActiveWritingGoal] = useState<{
    type: 'word_count' | 'paragraph_count'
    target: number
    current: number
    label: string
  } | null>(null)

  // Time tracking
  const [writingTime, setWritingTime] = useState(0)
  const [isWriting, setIsWriting] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Load document content
  useEffect(() => {
    if (currentDocument) {
      setText(currentDocument.content || "")
      setDocumentTitle(currentDocument.title || "My Essay")
    }
  }, [currentDocument])

  // Track writing time
  useEffect(() => {
    if (isWriting) {
      intervalRef.current = setInterval(() => {
        setWritingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isWriting])

  // Update writing goal progress
  const updateWritingGoal = useCallback(() => {
    if (!activeWritingGoal) return
    
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length
    
    let current = activeWritingGoal.type === 'word_count' ? wordCount : paragraphCount
    setActiveWritingGoal(prev => prev ? { ...prev, current } : null)
  }, [text, activeWritingGoal])

  useEffect(() => {
    updateWritingGoal()
  }, [updateWritingGoal])

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setIsWriting(true)
    
    // Stop writing timer after 30 seconds of inactivity
    setTimeout(() => setIsWriting(false), 30000)
  }

  // Insert essay template
  const insertTemplate = (templateKey: keyof typeof ESSAY_TEMPLATES) => {
    const template = ESSAY_TEMPLATES[templateKey]
    setText(template.template)
    setActiveTab('write')
  }

  // Insert academic phrase
  const insertAcademicPhrase = (phrase: string) => {
    const textarea = textAreaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.substring(0, start) + phrase + ' ' + text.substring(end)
    setText(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + phrase.length + 1, start + phrase.length + 1)
    }, 0)
  }

  // Save document
  const handleSave = async () => {
    if (!onSave) return
    
    setSaving(true)
    try {
      await onSave(documentTitle, text)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setSaving(false)
    }
  }

  // Set writing goal
  const setWritingGoal = (goal: typeof WRITING_GOALS[0]) => {
    setActiveWritingGoal({
      ...goal,
      current: 0
    })
    updateWritingGoal()
  }

  // Calculate stats
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
  const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length
  const estimatedReadingTime = Math.ceil(wordCount / 200)

  // Text formatting functions
  const formatText = (wrapper: string) => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)
    
    if (selectedText) {
      const newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end)
      setText(newText)
      
      // Restore selection
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + wrapper.length, end + wrapper.length)
      }, 0)
    }
  }

  const insertTextAtCursor = (insertText: string) => {
    if (!textAreaRef.current) return
    
    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const newText = text.substring(0, start) + insertText + text.substring(end)
    setText(newText)
    
    // Position cursor after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + insertText.length, start + insertText.length)
    }, 0)
  }

  // Citation handlers
  const handleInsertCitation = (citation: string, type: 'full' | 'intext') => {
    const formattedCitation = type === 'full' ? `\n\n${citation}\n\n` : citation
    insertTextAtCursor(formattedCitation)
  }

  const handleSaveCitation = (source: any) => {
    setSavedCitations(prev => [...prev, source])
    // In a real app, this would save to the database
  }

  const handleApplyFormatting = (formatting: any) => {
    // In a real app, this would apply formatting to the document
    console.log('Applying formatting:', formatting)
  }

  // Keyboard shortcuts configuration
  const keyboardShortcuts = createAcademicWritingShortcuts({
    // Document actions
    saveDocument: handleSave,
    newDocument: () => {
      setText("")
      setDocumentTitle("My Essay")
      textAreaRef.current?.focus()
    },
    
    // Writing mode actions
    switchToDraft: () => setWritingMode('draft'),
    switchToRevision: () => setWritingMode('revision'),
    switchToFinal: () => setWritingMode('final'),
    
    // Academic writing actions
    insertFiveParagraphTemplate: () => insertTemplate('five-paragraph'),
    insertArgumentativeTemplate: () => insertTemplate('argumentative'),
    insertCompareContrastTemplate: () => {
      // Use the five-paragraph as fallback since compare-contrast isn't in ESSAY_TEMPLATES
      insertTemplate('five-paragraph')
    },
    
    // Academic phrases
    insertTransitionPhrase: () => {
      const phrase = getRandomPhrase('transitions')
      insertTextAtCursor(phrase + ' ')
    },
    insertEvidencePhrase: () => {
      const phrase = getRandomPhrase('evidence')
      insertTextAtCursor(phrase + ' ')
    },
    insertConclusionPhrase: () => {
      const phrase = getRandomPhrase('conclusions')
      insertTextAtCursor(phrase + ' ')
    },
    
    // Formatting actions
    makeBold: () => formatText('**'),
    makeItalic: () => formatText('*'),
    insertBulletList: () => {
      insertTextAtCursor('\n• ')
    },
    insertNumberedList: () => {
      insertTextAtCursor('\n1. ')
    },
    
    // AI and tools
    openAITutor: () => setActiveTab('tutor'),
    checkGrammar: () => {
      // Trigger grammar check - placeholder for now
      console.log('Grammar check triggered')
    },
    showWordCount: () => setActiveTab('progress'),
    
    // Navigation
    focusEditor: () => textAreaRef.current?.focus(),
    showShortcutHelp: () => setShowShortcutHelp(true),
    
    // Conditions
    isEditorFocused: () => document.activeElement === textAreaRef.current,
    hasText: () => text.trim().length > 0
  })

  // Initialize keyboard shortcuts
  const { getShortcutHelp } = useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Academic Writing Assistant
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    High School Edition
                  </p>
                </div>
              </div>
              
              {/* Writing Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['draft', 'revision', 'final'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setWritingMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      writingMode === mode
                        ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-700 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Writing stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Type className="h-4 w-4" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(writingTime / 60)}:{(writingTime % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Writing goal progress */}
              {activeWritingGoal && (
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-1.5">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    {activeWritingGoal.current}/{activeWritingGoal.target}
                  </span>
                  <div className="w-12 bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (activeWritingGoal.current / activeWritingGoal.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Keyboard shortcuts help */}
              <KeyboardShortcutsHelp 
                shortcuts={getShortcutHelp()}
                open={showShortcutHelp}
                onOpenChange={setShowShortcutHelp}
              />
              
              {/* Show tour again button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={startOnboarding}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Info className="h-4 w-4 mr-2" />
                Tour
              </Button>
              
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline text-sm">{user.email}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Academic Tools Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Essay Templates */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Essay Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ESSAY_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate(key as keyof typeof ESSAY_TEMPLATES)}
                    className="w-full justify-start text-xs h-auto p-2 bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800"
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        {key === 'five-paragraph' && (
                          <Badge variant="secondary" className="text-xs font-mono ml-2">
                            ⌘⇧5
                          </Badge>
                        )}
                        {key === 'argumentative' && (
                          <Badge variant="secondary" className="text-xs font-mono ml-2">
                            ⌘⇧A
                          </Badge>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Academic Phrases */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center">
                  <Quote className="h-4 w-4 mr-2" />
                  Academic Phrases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ACADEMIC_PHRASES).map(([category, phrases]) => (
                  <DropdownMenu key={category}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800">
                        <ChevronRight className="h-3 w-3 mr-1" />
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60">
                      {phrases.map((phrase, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => insertAcademicPhrase(phrase)}
                          className="text-xs cursor-pointer"
                        >
                          {phrase}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </CardContent>
            </Card>

            {/* Writing Goals */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Writing Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {WRITING_GOALS.map((goal, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setWritingGoal(goal)}
                    className={`w-full justify-start text-xs ${
                      activeWritingGoal?.target === goal.target && activeWritingGoal?.type === goal.type
                        ? 'bg-green-100 border-green-300 dark:bg-green-900/50'
                        : 'bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {goal.label}
                  </Button>
                ))}
                {activeWritingGoal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveWritingGoal(null)}
                    className="w-full text-xs text-gray-500"
                  >
                    Clear Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-white dark:bg-gray-800 shadow-sm">
                <TabsTrigger value="write" className="flex items-center space-x-2">
                  <PenTool className="h-4 w-4" />
                  <span>Write</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Review</span>
                </TabsTrigger>
                <TabsTrigger value="citations" className="flex items-center space-x-2">
                  <Quote className="h-4 w-4" />
                  <span>Citations</span>
                </TabsTrigger>
                <TabsTrigger value="formatting" className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span>Format</span>
                </TabsTrigger>
                <TabsTrigger value="tutor" className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>AI Tutor</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Progress</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="write" className="space-y-4 mt-6">
                {/* Document header */}
                <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Input
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          className="text-lg font-semibold bg-transparent border-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          placeholder="Enter your essay title..."
                        />
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
                        <Button onClick={handleSave} size="sm" disabled={saving}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* First-time user welcome */}
                {isFirstVisit && !showOnboarding && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                    <Star className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Welcome to your Academic Writing Assistant!</strong>{' '}
                      You're all set to write amazing essays. Try the Tour button in the header if you want to learn about all the features again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Writing guidance */}
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>{writingMode.charAt(0).toUpperCase() + writingMode.slice(1)} Mode:</strong>{' '}
                    {writingMode === 'draft' && 'Focus on getting your ideas down. Use essay templates to get started!'}
                    {writingMode === 'revision' && 'Review your structure and strengthen your arguments with academic phrases.'}
                    {writingMode === 'final' && 'Polish your writing. Check grammar, citations, and formatting.'}
                  </AlertDescription>
                </Alert>

                {/* Main text editor with keyboard shortcuts */}
                <Card className="shadow-lg relative">
                  <CardContent className="p-0">
                    <div className="relative">
                      <Textarea
                        ref={textAreaRef}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={() => setShowShortcutHint(true)}
                        onBlur={() => setTimeout(() => setShowShortcutHint(false), 3000)}
                        placeholder={`Start writing your ${writingMode} here...

💡 Keyboard Shortcuts:
• Ctrl+T = Insert transition phrase
• Ctrl+E = Insert evidence phrase  
• Ctrl+Shift+5 = Insert 5-paragraph template
• Ctrl+1/2/3 = Switch writing modes
• Ctrl+S = Save your work
• Ctrl+Shift+? = Show all shortcuts

Tips for ${writingMode} mode:
${writingMode === 'draft' ? '• Use essay templates from the sidebar\n• Focus on expressing your ideas clearly\n• Don\'t worry about perfect grammar yet' : 
  writingMode === 'revision' ? '• Review your argument structure\n• Use academic phrases to strengthen writing\n• Make sure each paragraph supports your thesis' : 
  '• Proofread carefully\n• Check citations and formatting\n• Ensure strong conclusion'}`}
                        className="min-h-[600px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 p-8"
                        style={{ fontSize: '16px', lineHeight: '1.7' }}
                      />
                      
                      {/* Floating shortcut hint */}
                      <FloatingShortcutHint
                        shortcut={['ctrl', 'shift', '?']}
                        description="Show all shortcuts"
                        show={showShortcutHint && text.length === 0}
                        position="top"
                        className="top-4 right-4"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Goal progress */}
                {activeWritingGoal && (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">Writing Goal Progress</span>
                        </div>
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {activeWritingGoal.current}/{activeWritingGoal.target} {
                            activeWritingGoal.type === 'word_count' ? 'words' : 'paragraphs'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (activeWritingGoal.current / activeWritingGoal.target) * 100)} 
                        className="h-2"
                      />
                      {activeWritingGoal.current >= activeWritingGoal.target && (
                        <div className="flex items-center space-x-1 mt-2 text-green-700 dark:text-green-300">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-medium">Goal achieved! Great job!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Review Your Writing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Grammar checking and suggestions will appear here when you start writing.
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-500">No suggestions yet. Keep writing!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="citations" className="space-y-4 mt-6">
                <CitationHelper
                  onInsertCitation={handleInsertCitation}
                  onSaveCitation={handleSaveCitation}
                  savedCitations={savedCitations}
                />
              </TabsContent>

              <TabsContent value="formatting" className="space-y-4 mt-6">
                <AcademicFormatting
                  onApplyFormatting={handleApplyFormatting}
                  currentStyle={currentFormattingStyle}
                />
              </TabsContent>

              <TabsContent value="tutor" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-5 w-5" />
                      <span>AI Writing Tutor</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get help with your writing from our AI tutor. Ask questions about structure, arguments, or writing techniques.
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-500">AI Tutor integration coming soon!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Words Written</CardTitle>
                      <Type className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{wordCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {paragraphCount} paragraphs
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Writing Time</CardTitle>
                      <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.floor(writingTime / 60)}:{(writingTime % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This session
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{estimatedReadingTime}</div>
                      <p className="text-xs text-muted-foreground">
                        minutes to read
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        userName={user.email?.split('@')[0] || 'Student'}
      />
    </div>
  )
} 