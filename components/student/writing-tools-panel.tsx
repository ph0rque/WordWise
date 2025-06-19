"use client"

import { useState } from "react"
import {
  FileText,
  Quote,
  Target,
  BookOpen,
  List,
  PenTool,
  ChevronRight,
  Award,
  Star,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WritingToolsPanelProps {
  onInsertTemplate?: (template: string) => void
  onInsertPhrase?: (phrase: string) => void
  onSetGoal?: (goal: { type: 'word_count' | 'paragraph_count', target: number, label: string }) => void
  activeGoal?: {
    type: 'word_count' | 'paragraph_count'
    target: number
    current: number
    label: string
  } | null
  writingMode?: 'draft' | 'revision' | 'final'
}

// Essay templates for high school students
const ESSAY_TEMPLATES = {
  'five-paragraph': {
    name: '5-Paragraph Essay',
    description: 'Perfect for persuasive essays',
    template: `# [Your Essay Title]

## Introduction
• **Hook:** [Attention-grabbing opening]
• **Background:** [Context about your topic]
• **Thesis:** [Your main argument]

## Body Paragraph 1
• **Topic Sentence:** [Main point #1]
• **Evidence:** [Facts, quotes, examples]
• **Analysis:** [Explain the evidence]
• **Link:** [Connect to thesis]

## Body Paragraph 2
• **Topic Sentence:** [Main point #2]
• **Evidence:** [Facts, quotes, examples]
• **Analysis:** [Explain the evidence]
• **Link:** [Connect to thesis]

## Body Paragraph 3
• **Topic Sentence:** [Main point #3]
• **Evidence:** [Facts, quotes, examples]
• **Analysis:** [Explain the evidence]
• **Link:** [Connect to thesis]

## Conclusion
• **Restate Thesis:** [Rephrase main argument]
• **Summary:** [Recap main points]
• **Closing:** [Final thought]`
  },
  'argumentative': {
    name: 'Argumentative Essay',
    description: 'Defend your position',
    template: `# [Your Argument Title]

## Introduction
• **Hook:** [Compelling opening]
• **Background:** [Issue context]
• **Position:** [Your stance]
• **Thesis:** [Main argument + reasons]

## Argument 1 (Strongest)
• **Claim:** [Your point]
• **Evidence:** [Research, stats, expert opinions]
• **Explanation:** [Why this supports your claim]

## Argument 2
• **Claim:** [Your point]
• **Evidence:** [Research, stats, expert opinions]
• **Explanation:** [Why this supports your claim]

## Counter-argument & Response
• **Opposing View:** [What critics say]
• **Their Reasoning:** [Why they think this]
• **Your Rebuttal:** [Why you disagree]

## Conclusion
• **Restate Position:** [Your stance]
• **Summary:** [Key arguments]
• **Call to Action:** [What should happen?]`
  },
  'compare-contrast': {
    name: 'Compare & Contrast',
    description: 'Analyze similarities and differences',
    template: `# Comparing [Topic A] and [Topic B]

## Introduction
• **Hook:** [Interesting opening]
• **Subjects:** [What you're comparing]
• **Thesis:** [Main point about similarities/differences]

## Similarities
• **Point 1:** [How they're alike]
• **Point 2:** [How they're alike]
• **Point 3:** [How they're alike]

## Differences
• **Point 1:** [How they differ]
• **Point 2:** [How they differ]
• **Point 3:** [How they differ]

## Conclusion
• **Summary:** [Key similarities and differences]
• **Significance:** [Why these comparisons matter]`
  }
}

// Academic phrases for different purposes
const ACADEMIC_PHRASES = {
  'starting': [
    'This essay will examine...',
    'The purpose of this paper is to...',
    'This analysis will explore...',
    'The following discussion focuses on...',
  ],
  'transitions': [
    'Furthermore,',
    'Moreover,',
    'In addition,',
    'However,',
    'Nevertheless,',
    'On the other hand,',
    'Similarly,',
    'In contrast,',
  ],
  'evidence': [
    'According to research,',
    'Studies show that',
    'The evidence suggests',
    'As demonstrated by',
    'Research indicates that',
    'The data reveals',
  ],
  'analysis': [
    'This suggests that',
    'This demonstrates',
    'The significance of this is',
    'This reveals',
    'The implication is that',
    'This supports the idea that',
  ],
  'concluding': [
    'In conclusion,',
    'To summarize,',
    'In summary,',
    'Ultimately,',
    'Therefore,',
    'As a result,',
  ]
}

// Writing goals for students
const WRITING_GOALS = [
  { type: 'word_count' as const, target: 250, label: '250 words (short essay)' },
  { type: 'word_count' as const, target: 500, label: '500 words (2 pages)' },
  { type: 'word_count' as const, target: 750, label: '750 words (3 pages)' },
  { type: 'word_count' as const, target: 1000, label: '1000 words (4 pages)' },
  { type: 'paragraph_count' as const, target: 3, label: '3 paragraphs' },
  { type: 'paragraph_count' as const, target: 5, label: '5 paragraphs' },
  { type: 'paragraph_count' as const, target: 7, label: '7 paragraphs' },
]

// Writing tips based on mode
const WRITING_TIPS = {
  draft: [
    'Get your ideas down first - don\'t worry about perfection',
    'Use essay templates to structure your thoughts',
    'Focus on your main argument and supporting points',
    'Don\'t stop to fix every grammar error while drafting'
  ],
  revision: [
    'Read your essay aloud to check flow',
    'Make sure each paragraph supports your thesis',
    'Add transition words to connect ideas',
    'Strengthen weak arguments with more evidence'
  ],
  final: [
    'Check grammar and spelling carefully',
    'Verify all citations are properly formatted',
    'Ensure your conclusion ties everything together',
    'Read through one final time before submitting'
  ]
}

export function WritingToolsPanel({ 
  onInsertTemplate, 
  onInsertPhrase, 
  onSetGoal, 
  activeGoal, 
  writingMode = 'draft' 
}: WritingToolsPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleInsertTemplate = (templateKey: string) => {
    const template = ESSAY_TEMPLATES[templateKey as keyof typeof ESSAY_TEMPLATES]
    if (template && onInsertTemplate) {
      onInsertTemplate(template.template)
      setSelectedTemplate(templateKey)
    }
  }

  const handleInsertPhrase = (phrase: string) => {
    if (onInsertPhrase) {
      onInsertPhrase(phrase)
    }
  }

  const handleSetGoal = (goal: typeof WRITING_GOALS[0]) => {
    if (onSetGoal) {
      onSetGoal(goal)
    }
  }

  const goalProgress = activeGoal ? (activeGoal.current / activeGoal.target) * 100 : 0

  return (
    <div className="space-y-4 w-full max-w-sm">
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
              variant={selectedTemplate === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleInsertTemplate(key)}
              className="w-full justify-start text-xs h-auto p-3 bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800"
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-3 w-3 mr-1" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                {phrases.map((phrase, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleInsertPhrase(phrase)}
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
        <CardContent className="space-y-3">
          {/* Current goal progress */}
          {activeGoal && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                  Current Goal: {activeGoal.label}
                </span>
                <span className="text-xs text-green-700 dark:text-green-300">
                  {Math.round(goalProgress)}%
                </span>
              </div>
              <Progress value={goalProgress} className="h-2" />
              <div className="text-xs text-green-700 dark:text-green-300">
                {activeGoal.current} of {activeGoal.target} {
                  activeGoal.type === 'word_count' ? 'words' : 'paragraphs'
                } completed
              </div>
              {activeGoal.current >= activeGoal.target && (
                <div className="flex items-center space-x-1 text-green-700 dark:text-green-300">
                  <Star className="h-3 w-3" />
                  <span className="text-xs font-medium">Goal achieved! 🎉</span>
                </div>
              )}
            </div>
          )}

          {/* Goal selection */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
              Set a new goal:
            </div>
            {WRITING_GOALS.map((goal, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSetGoal(goal)}
                className={`w-full justify-start text-xs ${
                  activeGoal?.target === goal.target && activeGoal?.type === goal.type
                    ? 'bg-green-100 border-green-300 dark:bg-green-900/50'
                    : 'bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800'
                }`}
              >
                <Target className="h-3 w-3 mr-1" />
                {goal.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Writing Tips */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            {writingMode.charAt(0).toUpperCase() + writingMode.slice(1)} Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {WRITING_TIPS[writingMode].map((tip, index) => (
              <li key={index} className="flex items-start space-x-2 text-xs text-yellow-800 dark:text-yellow-200">
                <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Writing Mode Badge */}
      <div className="flex justify-center">
        <Badge 
          variant="outline" 
          className="text-xs font-medium px-3 py-1 bg-white/50 dark:bg-gray-800/50"
        >
          <PenTool className="h-3 w-3 mr-1" />
          {writingMode.charAt(0).toUpperCase() + writingMode.slice(1)} Mode
        </Badge>
      </div>
    </div>
  )
} 