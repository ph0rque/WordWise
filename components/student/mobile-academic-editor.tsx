"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  GraduationCap,
  PenTool,
  Target,
  Clock,
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
  Bot,
  TrendingUp,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { User as SupabaseUser, Document } from "@/lib/types"
import { 
  MobileResponsiveLayout, 
  MobileTabs, 
  MobileCardGrid, 
  TouchOptimizedButton,
  useDeviceType,
  mobileSpacing,
  SwipeableCard
} from './mobile-responsive-layout'
import { WritingToolsPanel } from './writing-tools-panel'
import { AutomaticRecorder, AutomaticRecorderRef } from '@/components/keystroke/automatic-recorder'

interface MobileAcademicEditorProps {
  user: SupabaseUser
  onSignOut: () => void
  currentDocument: Document | null
  onSave?: (title: string, content: string) => Promise<void>
}

// Essential essay templates for mobile
const MOBILE_ESSAY_TEMPLATES = {
  'five-paragraph': {
    name: '5-Paragraph Essay',
    emoji: '📝',
    description: 'Classic structure for most essays',
    template: `# [Your Essay Title]

## Introduction
[Hook - grab attention]
[Background information]
[Your thesis statement]

## First Point
[Topic sentence]
[Evidence and examples]
[Explain how this supports your thesis]

## Second Point
[Topic sentence]
[Evidence and examples]
[Explain how this supports your thesis]

## Third Point
[Topic sentence]
[Evidence and examples]
[Explain how this supports your thesis]

## Conclusion
[Restate your thesis]
[Summarize main points]
[Memorable closing thought]`
  },
  'argumentative': {
    name: 'Argumentative Essay',
    emoji: '⚖️',
    description: 'Take a stance and persuade',
    template: `# [Your Argument Topic]

## Introduction
[Attention-grabbing opener]
[Issue background]
[Your clear position]
[Preview of arguments]

## Your Strongest Argument
[Your main claim]
[Supporting evidence]
[Why this matters]

## Your Second Argument
[Another strong point]
[Different type of evidence]
[Connect to your position]

## Address Counter-Argument
[What opponents say]
[Why they think this]
[Your rebuttal with evidence]

## Conclusion
[Restate your position]
[Review key arguments]
[Call to action]`
  },
  'compare-contrast': {
    name: 'Compare & Contrast',
    emoji: '🔍',
    description: 'Analyze similarities and differences',
    template: `# Comparing [Subject A] vs [Subject B]

## Introduction
[Why this comparison matters]
[Brief intro to both subjects]
[Your main insight]

## Key Similarities
### How they're alike:
- [Similarity 1]
- [Similarity 2]
- [What this shows]

## Important Differences
### How they differ:
- [Difference 1]
- [Difference 2]
- [Why this matters]

## Conclusion
[What we learn from comparison]
[Deeper insight revealed]
[Why this analysis is important]`
  }
}

// Mobile-friendly academic phrases
const MOBILE_PHRASES = {
  'starters': [
    'This essay will explore...',
    'The main argument is...',
    'Research shows that...',
    'It is important to consider...',
  ],
  'transitions': [
    'Furthermore,',
    'In addition,',
    'However,',
    'On the other hand,',
    'As a result,',
    'For example,',
  ],
  'evidence': [
    'According to...',
    'Studies indicate...',
    'This demonstrates that...',
    'Evidence suggests...',
  ],
  'conclusions': [
    'In conclusion,',
    'To summarize,',
    'Therefore,',
    'Ultimately,',
  ]
}

// Mobile writing goals
const MOBILE_GOALS = [
  { type: 'word_count' as const, target: 250, label: '250 words', emoji: '🎯' },
  { type: 'word_count' as const, target: 500, label: '500 words', emoji: '📖' },
  { type: 'paragraph_count' as const, target: 5, label: '5 paragraphs', emoji: '📄' },
  { type: 'time' as const, target: 30, label: '30 minutes', emoji: '⏰' },
]

export function MobileAcademicEditor({ user, onSignOut, currentDocument, onSave }: MobileAcademicEditorProps) {
  const [text, setText] = useState<string>("")
  const [documentTitle, setDocumentTitle] = useState<string>("My Essay")
  const [writingMode, setWritingMode] = useState<'draft' | 'revision' | 'final'>('draft')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const recorderRef = useRef<AutomaticRecorderRef>(null)
  
  // Writing goals
  const [activeWritingGoal, setActiveWritingGoal] = useState<{
    type: 'word_count' | 'paragraph_count' | 'time'
    target: number
    current: number
    label: string
    emoji: string
  } | null>(null)

  // Time tracking
  const [writingTime, setWritingTime] = useState(0)
  const [isWriting, setIsWriting] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const { isMobile } = useDeviceType()

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

  // Calculate stats
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
  const paragraphCount = text.split('\n\n').filter(p => p.trim().length > 0).length
  const estimatedReadingTime = Math.ceil(wordCount / 200)

  // Update writing goal progress
  useEffect(() => {
    if (activeWritingGoal) {
      const current = activeWritingGoal.type === 'word_count' 
        ? wordCount 
        : activeWritingGoal.type === 'paragraph_count'
          ? paragraphCount
          : writingTime
      
      setActiveWritingGoal(prev => prev ? { ...prev, current } : null)
    }
  }, [wordCount, paragraphCount, writingTime])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setIsWriting(true)
    
    // Reset writing timer after 2 seconds of inactivity
    setTimeout(() => setIsWriting(false), 2000)
  }

  const insertTemplate = (templateKey: keyof typeof MOBILE_ESSAY_TEMPLATES) => {
    const template = MOBILE_ESSAY_TEMPLATES[templateKey]
    setText(prev => prev + '\n\n' + template.template)
    textAreaRef.current?.focus()
  }

  const insertPhrase = (phrase: string) => {
    if (textAreaRef.current) {
      const cursorPosition = textAreaRef.current.selectionStart
      const textBefore = text.substring(0, cursorPosition)
      const textAfter = text.substring(cursorPosition)
      setText(textBefore + phrase + ' ' + textAfter)
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus()
          textAreaRef.current.setSelectionRange(
            cursorPosition + phrase.length + 1,
            cursorPosition + phrase.length + 1
          )
        }
      }, 0)
    }
  }

  const handleSave = async () => {
    if (!onSave) return
    
    console.log('💾 Mobile editor manual save triggered, stopping keystroke recording...')
    
    // Stop keystroke recording when user manually saves
    if (recorderRef.current?.isRecording) {
      await recorderRef.current.stopRecording()
      console.log('⏹️ Keystroke recording stopped and session saved')
    }
    
    setSaving(true)
    try {
      await onSave(documentTitle, text)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const setWritingGoal = (goal: typeof MOBILE_GOALS[0]) => {
    setActiveWritingGoal({
      ...goal,
      current: goal.type === 'word_count' 
        ? wordCount 
        : goal.type === 'paragraph_count'
          ? paragraphCount
          : writingTime
    })
  }

  // Mobile header
  const mobileHeader = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <GraduationCap className="h-6 w-6 text-blue-600" />
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-gray-900 truncate">
            Academic Writing
          </h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Quick stats */}
        <Badge variant="outline" className="text-xs">
          {wordCount}w
        </Badge>
        
        {/* Tools toggle */}
        <TouchOptimizedButton
          variant="ghost"
          touchSize="sm"
          onClick={() => setToolsOpen(!toolsOpen)}
          className="p-2"
        >
          {toolsOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </TouchOptimizedButton>
        
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TouchOptimizedButton variant="ghost" touchSize="sm" className="p-2">
              <User className="h-4 w-4" />
            </TouchOptimizedButton>
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
  )

  // Writing tools panel
  const toolsPanel = (
    <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Essay Templates
        </h3>
        <div className="space-y-2">
          {Object.entries(MOBILE_ESSAY_TEMPLATES).map(([key, template]) => (
            <TouchOptimizedButton
              key={key}
              variant="outline"
              onClick={() => insertTemplate(key as keyof typeof MOBILE_ESSAY_TEMPLATES)}
              className="w-full justify-start h-auto p-3"
            >
              <div className="text-left w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{template.emoji}</span>
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              </div>
            </TouchOptimizedButton>
          ))}
        </div>
      </div>

      {/* Academic Phrases */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Academic Phrases</h3>
        <div className="space-y-3">
          {Object.entries(MOBILE_PHRASES).map(([category, phrases]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-700 mb-2 capitalize">{category}</h4>
              <div className="grid grid-cols-1 gap-1">
                {phrases.map((phrase, index) => (
                  <TouchOptimizedButton
                    key={index}
                    variant="ghost"
                    onClick={() => insertPhrase(phrase)}
                    className="justify-start text-xs h-8 p-2 text-left"
                  >
                    {phrase}
                  </TouchOptimizedButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Goals */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Writing Goals</h3>
        <div className="grid grid-cols-2 gap-2">
          {MOBILE_GOALS.map((goal, index) => (
            <TouchOptimizedButton
              key={index}
              variant={activeWritingGoal?.target === goal.target && activeWritingGoal?.type === goal.type ? "default" : "outline"}
              onClick={() => setWritingGoal(goal)}
              className="h-auto p-3"
            >
              <div className="text-center">
                <div className="text-lg mb-1">{goal.emoji}</div>
                <div className="text-xs font-medium">{goal.label}</div>
              </div>
            </TouchOptimizedButton>
          ))}
        </div>
        {activeWritingGoal && (
          <TouchOptimizedButton
            variant="ghost"
            onClick={() => setActiveWritingGoal(null)}
            className="w-full mt-2 text-xs text-gray-500"
          >
            Clear Goal
          </TouchOptimizedButton>
        )}
      </div>
    </div>
  )

  // Tab content
  const tabContent = [
    {
      id: 'write',
      label: 'Write',
      icon: PenTool,
      content: (
        <div className="space-y-4">
          {/* Document header */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="text-base font-semibold bg-transparent border-none focus-visible:ring-2 focus-visible:ring-blue-500 px-0"
                  placeholder="Enter your essay title..."
                />
                
                {/* Writing mode selector */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  {['draft', 'revision', 'final'].map((mode) => (
                    <TouchOptimizedButton
                      key={mode}
                      variant={writingMode === mode ? "default" : "ghost"}
                      touchSize="sm"
                      onClick={() => setWritingMode(mode as typeof writingMode)}
                      className={cn(
                        "flex-1 text-xs",
                        writingMode === mode && "bg-blue-600 text-white"
                      )}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </TouchOptimizedButton>
                  ))}
                </div>

                {/* Save button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {saving && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Saving...</span>
                      </>
                    )}
                    {lastSaved && !saving && (
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    )}
                  </div>
                  <TouchOptimizedButton 
                    onClick={handleSave} 
                    touchSize="sm"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </TouchOptimizedButton>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Writing guidance */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>{writingMode.charAt(0).toUpperCase() + writingMode.slice(1)} Mode:</strong>
              <div className="mt-1">
                {writingMode === 'draft' && 'Focus on getting your ideas down. Use templates to get started!'}
                {writingMode === 'revision' && 'Review structure and strengthen arguments with academic phrases.'}
                {writingMode === 'final' && 'Polish writing. Check grammar, citations, and formatting.'}
              </div>
            </AlertDescription>
          </Alert>

          {/* Main text editor */}
          <Card>
            <CardContent className="p-0">
              <Textarea
                ref={textAreaRef}
                value={text}
                onChange={handleTextChange}
                placeholder={`Start writing your ${writingMode} here...

Tap the menu (☰) above to access:
• Essay templates
• Academic phrases
• Writing goals

Tips for ${writingMode} mode:
${writingMode === 'draft' 
  ? '• Use essay templates to get started\n• Focus on expressing your ideas\n• Don\'t worry about perfect grammar yet' 
  : writingMode === 'revision' 
    ? '• Review your argument structure\n• Use academic phrases\n• Ensure each paragraph supports your thesis' 
    : '• Proofread carefully\n• Check citations and formatting\n• Ensure strong conclusion'}`}
                className="min-h-[400px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 p-4"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              />
            </CardContent>
          </Card>

          {/* Goal progress */}
          {activeWritingGoal && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{activeWritingGoal.emoji}</span>
                      <span className="font-medium text-green-800 text-sm">
                        Writing Goal
                      </span>
                    </div>
                    <span className="text-sm text-green-700">
                      {activeWritingGoal.current}/{activeWritingGoal.target} {
                        activeWritingGoal.type === 'word_count' ? 'words' : 
                        activeWritingGoal.type === 'paragraph_count' ? 'paragraphs' : 'minutes'
                      }
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (activeWritingGoal.current / activeWritingGoal.target) * 100)} 
                    className="h-3"
                  />
                  {activeWritingGoal.current >= activeWritingGoal.target && (
                    <div className="flex items-center space-x-1 text-green-700">
                      <Star className="h-4 w-4" />
                      <span className="text-sm font-medium">Goal achieved! Great job! 🎉</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <MobileCardGrid>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Words</CardTitle>
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
                <CardTitle className="text-sm font-medium">Time</CardTitle>
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
                <CardTitle className="text-sm font-medium">Reading</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estimatedReadingTime}</div>
                <p className="text-xs text-muted-foreground">
                  min to read
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mode</CardTitle>
                <PenTool className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold capitalize">{writingMode}</div>
                <p className="text-xs text-muted-foreground">
                  Current mode
                </p>
              </CardContent>
            </Card>
          </MobileCardGrid>
        </div>
      )
    }
  ]

  return (
    <MobileResponsiveLayout header={mobileHeader}>
      {/* Automatic Keystroke Recording - Invisible */}
      <AutomaticRecorder
        ref={recorderRef}
        documentId={currentDocument?.id || 'mobile-essay'}
        documentTitle={documentTitle}
        studentName={user.email || 'mobile-student'}
        textAreaRef={textAreaRef}
      />

      {/* Tools panel overlay */}
      {toolsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setToolsOpen(false)}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Writing Tools</h2>
              <TouchOptimizedButton
                variant="ghost"
                touchSize="sm"
                onClick={() => setToolsOpen(false)}
                className="p-2"
              >
                <ChevronDown className="h-5 w-5" />
              </TouchOptimizedButton>
            </div>
            {toolsPanel}
          </div>
        </div>
      )}

      {/* Main content */}
      <MobileTabs 
        tabs={tabContent}
        defaultTab="write"
        className="w-full"
      />
    </MobileResponsiveLayout>
  )
} 