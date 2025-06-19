"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  PenTool,
  Lightbulb,
  Target,
  Award,
  Clock,
  AlertTriangle,
  Info,
  Star,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface WritingGuideWizardProps {
  essayType?: string
  onContentChange?: (step: number, content: string) => void
  onComplete?: (completedEssay: string) => void
}

// Step-by-step writing guide structure
const WRITING_STEPS = {
  'five-paragraph': [
    {
      id: 'planning',
      title: 'Planning & Brainstorming',
      description: 'Organize your thoughts before you start writing',
      timeEstimate: '10-15 minutes',
      icon: Target,
      content: {
        instruction: 'Before you start writing, let\'s plan your essay. This will make writing much easier!',
        prompts: [
          'What is your main topic or question?',
          'What is your opinion or position on this topic?',
          'What are 3 main reasons that support your position?',
          'What evidence (facts, examples, quotes) do you have for each reason?'
        ],
        tips: [
          'Write down everything that comes to mind - you can organize it later',
          'Think about what your reader needs to know to understand your topic',
          'Your strongest argument should go first in your essay'
        ],
        example: 'Topic: Should students wear uniforms?\nPosition: Yes, students should wear uniforms\nReasons: 1) Reduces bullying 2) Saves money 3) Improves focus'
      }
    },
    {
      id: 'introduction',
      title: 'Writing Your Introduction',
      description: 'Hook your reader and present your thesis',
      timeEstimate: '10-15 minutes',
      icon: BookOpen,
      content: {
        instruction: 'Your introduction has three jobs: grab attention, give background, and state your thesis.',
        prompts: [
          'Write an attention-grabbing opening (question, surprising fact, or quote)',
          'Provide brief background information about your topic',
          'Write your thesis statement that includes your position and three main points'
        ],
        tips: [
          'Start with something that would make YOU want to keep reading',
          'Keep background info brief - 2-3 sentences is enough',
          'Your thesis should be the last sentence of your introduction'
        ],
        example: 'Hook: "What if I told you that what you wear to school could determine whether you get bullied?"\nBackground: School uniforms have been debated for decades...\nThesis: Schools should require uniforms because they reduce bullying, save families money, and help students focus on learning.'
      }
    },
    {
      id: 'body1',
      title: 'Body Paragraph 1 (Strongest Argument)',
      description: 'Present your most convincing point',
      timeEstimate: '15-20 minutes',
      icon: PenTool,
      content: {
        instruction: 'This paragraph should contain your strongest, most convincing argument.',
        prompts: [
          'Write a topic sentence that introduces your first main point',
          'Provide specific evidence (facts, statistics, examples, or quotes)',
          'Explain how this evidence proves your point',
          'Add a transition sentence that connects to your next paragraph'
        ],
        tips: [
          'Be specific - use numbers, names, and concrete examples',
          'Explain the evidence - don\'t assume readers will make the connection',
          'Use transition words like "Furthermore" or "Additionally" at the end'
        ],
        example: 'Topic sentence: School uniforms significantly reduce bullying and social pressure.\nEvidence: According to a 2019 study by the National Association of Elementary School Principals...\nAnalysis: This shows that uniforms level the playing field...'
      }
    },
    {
      id: 'body2',
      title: 'Body Paragraph 2',
      description: 'Present your second supporting argument',
      timeEstimate: '15-20 minutes',
      icon: PenTool,
      content: {
        instruction: 'Your second body paragraph should support your thesis with a different type of argument.',
        prompts: [
          'Write a topic sentence for your second main point',
          'Provide different type of evidence from paragraph 1',
          'Explain how this evidence supports your thesis',
          'Connect to your third paragraph with a transition'
        ],
        tips: [
          'Use a different type of evidence than paragraph 1 (if first was statistics, try examples)',
          'Make sure this point is clearly different from your first point',
          'Keep the same level of detail and development as paragraph 1'
        ]
      }
    },
    {
      id: 'body3',
      title: 'Body Paragraph 3',
      description: 'Present your third supporting argument',
      timeEstimate: '15-20 minutes',
      icon: PenTool,
      content: {
        instruction: 'Your final body paragraph should complete your argument and prepare for the conclusion.',
        prompts: [
          'Write a topic sentence for your third main point',
          'Provide evidence that supports this point',
          'Explain the significance of this evidence',
          'Transition toward your conclusion'
        ],
        tips: [
          'This can be your most emotional or forward-looking argument',
          'Think about long-term impacts or broader implications',
          'Prepare readers to wrap up by using phrases like "Most importantly" or "Finally"'
        ]
      }
    },
    {
      id: 'conclusion',
      title: 'Writing Your Conclusion',
      description: 'Wrap up powerfully and leave a lasting impression',
      timeEstimate: '10-15 minutes',
      icon: Award,
      content: {
        instruction: 'Your conclusion should remind readers of your argument and leave them thinking.',
        prompts: [
          'Restate your thesis in different words (don\'t copy it exactly)',
          'Briefly summarize your three main points',
          'End with a call to action, prediction, or thought-provoking question'
        ],
        tips: [
          'Don\'t introduce new information in your conclusion',
          'Make your ending memorable - what do you want readers to remember?',
          'Consider what action you want readers to take'
        ],
        example: 'Restate: Clearly, requiring school uniforms benefits everyone in the school community.\nSummary: From reducing social pressures to helping families save money...\nClosing: The question isn\'t whether we can afford school uniforms - it\'s whether we can afford not to have them.'
      }
    },
    {
      id: 'revision',
      title: 'Revision & Editing',
      description: 'Polish your essay and check for errors',
      timeEstimate: '15-20 minutes',
      icon: CheckCircle2,
      content: {
        instruction: 'Now let\'s make your essay the best it can be!',
        prompts: [
          'Read your essay aloud - does it flow smoothly?',
          'Check that each body paragraph supports your thesis',
          'Look for grammar, spelling, and punctuation errors',
          'Make sure your transitions connect ideas clearly'
        ],
        tips: [
          'Reading aloud helps you catch awkward sentences',
          'Each paragraph should have one main idea',
          'Check that your evidence actually supports your points',
          'Make sure your conclusion doesn\'t just repeat your introduction'
        ]
      }
    }
  ]
}

export function WritingGuideWizard({ 
  essayType = 'five-paragraph', 
  onContentChange, 
  onComplete 
}: WritingGuideWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepContent, setStepContent] = useState<Record<number, string>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const steps = WRITING_STEPS[essayType as keyof typeof WRITING_STEPS] || WRITING_STEPS['five-paragraph']
  const currentStepData = steps[currentStep]
  const totalSteps = steps.length
  const progress = ((completedSteps.size) / totalSteps) * 100

  useEffect(() => {
    if (stepContent[currentStep]) {
      onContentChange?.(currentStep, stepContent[currentStep])
    }
  }, [currentStep, stepContent, onContentChange])

  const handleContentChange = (content: string) => {
    setStepContent(prev => ({
      ...prev,
      [currentStep]: content
    }))
  }

  const handleNext = () => {
    if (stepContent[currentStep] && stepContent[currentStep].trim().length > 0) {
      setCompletedSteps(prev => new Set(prev).add(currentStep))
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const handleFinish = () => {
    // Compile all content into a complete essay
    const essayParts = steps.map((step, index) => {
      const content = stepContent[index] || ''
      return content.trim()
    }).filter(part => part.length > 0)
    
    const completeEssay = essayParts.join('\n\n')
    onComplete?.(completeEssay)
  }

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(stepIndex) || (stepContent[stepIndex] && stepContent[stepIndex].trim().length > 0)
  }

  const canProceed = stepContent[currentStep] && stepContent[currentStep].trim().length > 20

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PenTool className="h-6 w-6 text-green-600" />
              <span>Writing Guide: {essayType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Essay</span>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isCompleted = isStepCompleted(index)
              const isCurrent = index === currentStep
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <IconComponent className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guidance Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <currentStepData.icon className="h-5 w-5 text-blue-600" />
                <span>{currentStepData.title}</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStepData.description}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{currentStepData.timeEstimate}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {currentStepData.content.instruction}
                </AlertDescription>
              </Alert>

              {/* Writing Prompts */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  What to write:
                </h4>
                <ul className="space-y-2">
                  {currentStepData.content.prompts.map((prompt, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                      <span className="text-blue-500 text-xs mt-1">•</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Tips:
                </h4>
                <ul className="space-y-1">
                  {currentStepData.content.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                      <Star className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Example (if available) */}
              {currentStepData.content.example && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Example:</h4>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-l-4 border-blue-500">
                    <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-sans">
                      {currentStepData.content.example}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Writing Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Write Your {currentStepData.title}</span>
                {isStepCompleted(currentStep) && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={stepContent[currentStep] || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`Start writing your ${currentStepData.title.toLowerCase()}...`}
                className="min-h-[400px] text-base leading-relaxed"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              />
              
              {/* Word Count and Feedback */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {stepContent[currentStep] ? stepContent[currentStep].trim().split(/\s+/).length : 0} words
                </span>
                {!canProceed && stepContent[currentStep] && (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Write a bit more to continue</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {canProceed ? (
                <span className="text-green-600 font-medium">Ready to continue!</span>
              ) : (
                <span>Keep writing to move to the next step</span>
              )}
            </div>

            {currentStep === totalSteps - 1 ? (
              <Button
                onClick={handleFinish}
                disabled={!canProceed}
                className="bg-green-600 hover:bg-green-700"
              >
                <Award className="h-4 w-4 mr-1" />
                Finish Essay
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next Step
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 