"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
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
  FileText,
  Save,
  User,
  LogOut,
  Lightbulb,
  Bot,
  BookOpen,
  BarChart3,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Info,
  Award,
  Star,
  Zap,
  Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { User as SupabaseUser, Document } from "@/lib/types"

interface StudentAcademicEditorProps {
  user: SupabaseUser
  onSignOut: () => void
  currentDocument: Document | null
  onSave?: (title: string, content: string) => Promise<void>
}

// Academic writing templates
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
  },
  'literary-analysis': {
    name: 'Literary Analysis',
    description: 'Analyze themes, characters, or literary devices in literature',
    template: `# [Literary Analysis Title]

## Introduction
• **Author & Work:** [Introduce the author and title of the work]
• **Brief Summary:** [Provide context without spoiling the plot]
• **Thesis Statement:** [State what you'll analyze and your main insight]

## Analysis Point 1: [First Literary Element]
• **What You're Analyzing:** [Theme, character, symbol, etc.]
• **Textual Evidence:** [Specific quotes or scenes from the text]
• **Literary Device:** [Metaphor, symbolism, irony, etc.]
• **Interpretation:** [What does this reveal about the work's meaning?]
• **Significance:** [Why is this important to understanding the work?]

## Analysis Point 2: [Second Literary Element]
• **What You're Analyzing:** [Theme, character, symbol, etc.]
• **Textual Evidence:** [Specific quotes or scenes from the text]
• **Literary Device:** [Metaphor, symbolism, irony, etc.]
• **Interpretation:** [What does this reveal about the work's meaning?]
• **Significance:** [Why is this important to understanding the work?]

## Analysis Point 3: [Third Literary Element]
• **What You're Analyzing:** [Theme, character, symbol, etc.]
• **Textual Evidence:** [Specific quotes or scenes from the text]
• **Literary Device:** [Metaphor, symbolism, irony, etc.]
• **Interpretation:** [What does this reveal about the work's meaning?]
• **Significance:** [Why is this important to understanding the work?]

## Conclusion
• **Synthesis:** [How do all your analysis points work together?]
• **Broader Meaning:** [What does this reveal about human nature, society, etc.?]
• **Lasting Impact:** [Why does this work still matter today?]`
  }
}

// Academic phrases organized by category
const ACADEMIC_PHRASES = {
  'introductions': [
    'This essay will examine...',
    'The purpose of this analysis is to...',
    'This paper argues that...',
    'The following discussion will explore...',
    'This study investigates...',
  ],
  'transitions': [
    'Furthermore,',
    'Moreover,',
    'In addition to this,',
    'Consequently,',
    'However,',
    'Nevertheless,',
    'On the contrary,',
    'In contrast,',
    'Similarly,',
    'Likewise,',
  ],
  'analysis': [
    'This evidence suggests that',
    'The author\'s use of',
    'This demonstrates',
    'The significance of this is',
    'This reveals',
    'The implication is that',
    'This supports the argument that',
    'The data indicates that',
  ],
  'conclusions': [
    'In conclusion,',
    'To summarize,',
    'In summary,',
    'Ultimately,',
    'Therefore,',
    'As a result,',
    'In light of this evidence,',
    'Given these findings,',
  ]
}

// Writing goals presets for students
const WRITING_GOALS = [
  { type: 'word_count' as const, target: 300, label: '300 words (1 page)' },
  { type: 'word_count' as const, target: 500, label: '500 words (2 pages)' },
  { type: 'word_count' as const, target: 750, label: '750 words (3 pages)' },
  { type: 'word_count' as const, target: 1000, label: '1000 words (4 pages)' },
  { type: 'paragraph_count' as const, target: 3, label: '3 paragraphs' },
  { type: 'paragraph_count' as const, target: 5, label: '5 paragraphs' },
  { type: 'paragraph_count' as const, target: 7, label: '7 paragraphs' },
]

export function StudentAcademicEditor({ user, onSignOut, currentDocument, onSave }: StudentAcademicEditorProps) {
  const [text, setText] = useState<string>("")
  const [documentTitle, setDocumentTitle] = useState<string>("My Essay")
  const [activeTab, setActiveTab] = useState<string>("write")
  const [writingMode, setWritingMode] = useState<'draft' | 'revision' | 'final'>('draft')
  const [showAcademicTools, setShowAcademicTools] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Writing goals state
  const [activeWritingGoal, setActiveWritingGoal] = useState<{
    type: 'word_count' | 'paragraph_count' | 'time'
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
    
    let current = 0
    switch (activeWritingGoal.type) {
      case 'word_count':
        current = wordCount
        break
      case 'paragraph_count':
        current = paragraphCount
        break
      case 'time':
        current = Math.floor(writingTime / 60) // convert to minutes
        break
    }
    
    setActiveWritingGoal(prev => prev ? { ...prev, current } : null)
  }, [text, writingTime, activeWritingGoal])

  useEffect(() => {
    updateWritingGoal()
  }, [updateWritingGoal])

  // Text editing handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setIsWriting(true)
    
    // Stop writing timer after 30 seconds of inactivity
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
    }
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
    
    // Set cursor position after inserted phrase
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

  // Calculate current stats
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
  const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length
  const estimatedReadingTime = Math.ceil(wordCount / 200) // 200 words per minute

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-900 dark:to-purple-950">
      {/* Student-friendly header */}
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

            {/* Stats and user menu */}
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
                {estimatedReadingTime > 0 && (
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{estimatedReadingTime} min read</span>
                  </div>
                )}
              </div>

              {/* Active writing goal */}
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
          {showAcademicTools && (
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
                      <div className="text-left">
                        <div className="font-medium">{template.name}</div>
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
          )}

          {/* Main Editor Area */}
          <div className={showAcademicTools ? "lg:col-span-4" : "lg:col-span-5"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 shadow-sm">
                <TabsTrigger value="write" className="flex items-center space-x-2">
                  <PenTool className="h-4 w-4" />
                  <span>Write</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Review</span>
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

                {/* Writing mode guidance */}
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>{writingMode.charAt(0).toUpperCase() + writingMode.slice(1)} Mode:</strong>{' '}
                    {writingMode === 'draft' && 'Focus on getting your ideas down. Don\'t worry about perfect grammar yet.'}
                    {writingMode === 'revision' && 'Review your structure and arguments. Make sure each paragraph supports your thesis.'}
                    {writingMode === 'final' && 'Polish your writing. Check grammar, citations, and formatting.'}
                  </AlertDescription>
                </Alert>

                {/* Main editor */}
                <Card className="shadow-lg">
                  <CardContent className="p-0">
                    <Textarea
                      ref={textAreaRef}
                      value={text}
                      onChange={handleTextChange}
                      placeholder={`Start writing your ${writingMode === 'draft' ? 'first draft' : writingMode === 'revision' ? 'revised essay' : 'final essay'}...

${writingMode === 'draft' ? 'Tips:\n• Use the essay templates to get started\n• Focus on expressing your ideas clearly\n• Don\'t stop to fix every error - keep writing!' : 
  writingMode === 'revision' ? 'Tips:\n• Read your essay aloud to check flow\n• Make sure each paragraph supports your thesis\n• Use academic phrases to strengthen your writing' : 
  'Tips:\n• Proofread carefully for grammar and spelling\n• Check that your citations are properly formatted\n• Make sure your conclusion ties everything together'}`}
                      className="min-h-[600px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 p-8"
                      style={{ fontSize: '16px', lineHeight: '1.7' }}
                    />
                  </CardContent>
                </Card>

                {/* Writing progress */}
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
                            activeWritingGoal.type === 'word_count' ? 'words' :
                            activeWritingGoal.type === 'paragraph_count' ? 'paragraphs' : 'minutes'
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
                  {/* Writing stats */}
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

                {/* Goal progress */}
                {activeWritingGoal && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Current Goal</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{activeWritingGoal.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((activeWritingGoal.current / activeWritingGoal.target) * 100)}%
                          </span>
                        </div>
                        <Progress value={(activeWritingGoal.current / activeWritingGoal.target) * 100} />
                        <p className="text-xs text-muted-foreground">
                          {activeWritingGoal.current} of {activeWritingGoal.target} {
                            activeWritingGoal.type === 'word_count' ? 'words' :
                            activeWritingGoal.type === 'paragraph_count' ? 'paragraphs' : 'minutes'
                          } completed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 