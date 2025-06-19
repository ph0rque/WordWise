"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  GraduationCap,
  BookOpen,
  FileText,
  Quote,
  Type,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  Award,
  Sparkles,
  Clock,
  Users,
  Star,
  Lightbulb,
  Keyboard,
  Smartphone,
  Eye,
  ChevronRight,
  PartyPopper,
  Trophy
} from 'lucide-react'

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Your Academic Writing Assistant! 🎓',
    description: 'Get ready to become a better writer with AI-powered tools designed just for high school students.',
    icon: GraduationCap,
    content: {
      type: 'welcome',
      highlights: [
        'AI-powered grammar checking',
        'Academic writing templates', 
        'Citation helper for MLA, APA, Chicago',
        'Progress tracking and goals',
        'Mobile-friendly design'
      ]
    }
  },
  {
    id: 'writing-modes',
    title: 'Master the 3 Writing Modes ✍️',
    description: 'Learn how Draft, Revision, and Final modes help you write better essays step by step.',
    icon: FileText,
    content: {
      type: 'modes',
      modes: [
        {
          name: 'Draft Mode',
          description: 'Focus on getting your ideas down without worrying about perfection',
          features: ['Essay templates', 'Idea organization', 'No pressure writing'],
          color: 'blue'
        },
        {
          name: 'Revision Mode', 
          description: 'Strengthen your arguments and improve your essay structure',
          features: ['Academic phrases', 'Structure analysis', 'Content improvement'],
          color: 'orange'
        },
        {
          name: 'Final Mode',
          description: 'Polish your writing with grammar checking and formatting',
          features: ['Grammar check', 'Citation help', 'Format assistance'],
          color: 'green'
        }
      ]
    }
  },
  {
    id: 'essay-templates',
    title: 'Start Strong with Essay Templates 📝',
    description: 'Never stare at a blank page again! Use our high school-friendly templates.',
    icon: BookOpen,
    content: {
      type: 'templates',
      templates: [
        {
          name: '5-Paragraph Essay',
          description: 'Perfect for most high school assignments',
          useCase: 'Persuasive essays, opinion pieces, simple analysis',
          structure: ['Introduction + Thesis', '3 Body Paragraphs', 'Strong Conclusion']
        },
        {
          name: 'Argumentative Essay',
          description: 'Take a stand and defend your position',
          useCase: 'Debate topics, controversial issues, research papers',
          structure: ['Position Statement', 'Supporting Arguments', 'Counter-argument & Rebuttal']
        },
        {
          name: 'Compare & Contrast',
          description: 'Analyze similarities and differences',
          useCase: 'Literature comparison, historical analysis, decision making',
          structure: ['Introduction', 'Similarities', 'Differences', 'Conclusion']
        }
      ]
    }
  },
  {
    id: 'academic-phrases',
    title: 'Sound Smarter with Academic Phrases 🎯',
    description: 'Use professional phrases that make your writing sound more academic and polished.',
    icon: Quote,
    content: {
      type: 'phrases',
      categories: [
        {
          name: 'Introductions', 
          phrases: ['This essay will examine...', 'The purpose of this analysis is to...', 'This paper argues that...'],
          usage: 'Start your essays with confidence'
        },
        {
          name: 'Transitions',
          phrases: ['Furthermore,', 'Moreover,', 'However,', 'On the contrary,'],
          usage: 'Connect your ideas smoothly'
        },
        {
          name: 'Evidence & Analysis',
          phrases: ['This evidence suggests that', 'This demonstrates', 'The significance of this is'],
          usage: 'Strengthen your arguments'
        },
        {
          name: 'Conclusions',
          phrases: ['In conclusion,', 'Ultimately,', 'Therefore,', 'To summarize,'],
          usage: 'End with impact'
        }
      ]
    }
  },
  {
    id: 'citations',
    title: 'Master Citations Like a Pro 📚',
    description: 'Learn to cite sources correctly in MLA, APA, and Chicago formats.',
    icon: FileText,
    content: {
      type: 'citations',
      formats: [
        {
          name: 'MLA',
          description: 'Modern Language Association',
          useCase: 'English, Literature, Humanities classes',
          example: 'Smith, John. "Article Title." Website Name, Date, URL.'
        },
        {
          name: 'APA', 
          description: 'American Psychological Association',
          useCase: 'Psychology, Social Sciences, Sciences',
          example: 'Smith, J. (2024). Article title. Website Name. URL'
        },
        {
          name: 'Chicago',
          description: 'Chicago Manual of Style',
          useCase: 'History, Literature, Arts',
          example: 'John Smith. "Article Title." Website Name. Accessed Date. URL.'
        }
      ]
    }
  },
  {
    id: 'goals-progress',
    title: 'Set Goals & Track Progress 📈',
    description: 'Stay motivated with writing goals, achievements, and progress tracking.',
    icon: Target,
    content: {
      type: 'goals',
      features: [
        {
          name: 'Writing Goals',
          description: 'Set word count, paragraph, or time-based goals',
          benefit: 'Stay focused and motivated'
        },
        {
          name: 'Achievement System',
          description: 'Earn badges for writing milestones',
          benefit: 'Celebrate your progress'
        },
        {
          name: 'Progress Dashboard',
          description: 'See your writing stats and improvement',
          benefit: 'Track your growth as a writer'
        },
        {
          name: 'Streak Tracking',
          description: 'Build consistent writing habits',
          benefit: 'Develop discipline'
        }
      ]
    }
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Write Faster with Shortcuts ⌨️',
    description: 'Learn time-saving keyboard shortcuts that make you a more efficient writer.',
    icon: Keyboard,
    content: {
      type: 'shortcuts',
      shortcuts: [
        { keys: 'Ctrl + S', action: 'Save your work', category: 'Essential' },
        { keys: 'Ctrl + 1/2/3', action: 'Switch writing modes', category: 'Essential' },
        { keys: 'Ctrl + Shift + 5', action: 'Insert 5-paragraph template', category: 'Templates' },
        { keys: 'Ctrl + T', action: 'Insert transition phrase', category: 'Academic' },
        { keys: 'Ctrl + E', action: 'Insert evidence phrase', category: 'Academic' },
        { keys: 'Ctrl + Shift + ?', action: 'Show all shortcuts', category: 'Help' }
      ]
    }
  },
  {
    id: 'mobile-ready',
    title: 'Write Anywhere, Anytime 📱',
    description: 'Your writing assistant works perfectly on phones, tablets, and computers.',
    icon: Smartphone,
    content: {
      type: 'mobile',
      features: [
        'Touch-optimized interface',
        'Swipe-friendly navigation', 
        'Mobile essay templates',
        'Quick phrase insertion',
        'Thumb-friendly buttons',
        'Auto-save on mobile'
      ]
    }
  },
  {
    id: 'ready-to-write',
    title: 'You\'re Ready to Write! 🚀',
    description: 'Congratulations! You now know how to use all the features to write amazing essays.',
    icon: Trophy,
    content: {
      type: 'completion',
      achievements: [
        'Learned about writing modes',
        'Discovered essay templates', 
        'Mastered academic phrases',
        'Understood citation formats',
        'Set up goals and progress tracking',
        'Learned keyboard shortcuts',
        'Ready for mobile writing'
      ],
      nextSteps: [
        'Start with a template that matches your assignment',
        'Use Draft mode to get your ideas down first',
        'Add academic phrases to sound more professional',
        'Track your progress with writing goals',
        'Practice the keyboard shortcuts'
      ]
    }
  }
]

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  userName?: string
}

export default function OnboardingFlow({ 
  isOpen, 
  onComplete, 
  onSkip, 
  userName = "Student" 
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const currentStepData = ONBOARDING_STEPS[currentStep]
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentStep])
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 150)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(stepIndex)
        setIsAnimating(false)
      }, 150)
    }
  }

  // Render step content based on type
  const renderStepContent = () => {
    const content = currentStepData.content

    switch (content.type) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome, {userName}! 🎉</h3>
              <p className="text-gray-600">
                You're about to discover the most powerful academic writing tools designed specifically for high school students like you!
              </p>
            </div>
            <div className="grid gap-3">
              {content.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-800">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'modes':
        return (
          <div className="space-y-4">
            {content.modes.map((mode, index) => {
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200 text-blue-800',
                orange: 'bg-orange-50 border-orange-200 text-orange-800', 
                green: 'bg-green-50 border-green-200 text-green-800'
              }
              return (
                <Card key={index} className={`border-2 ${colorClasses[mode.color as keyof typeof colorClasses]}`}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{mode.name}</h4>
                    <p className="text-sm mb-3">{mode.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {mode.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )

      case 'templates':
        return (
          <div className="space-y-4">
            {content.templates.map((template, index) => (
              <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-blue-800">{template.name}</h4>
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <p className="text-xs text-gray-500 mb-3"><strong>Best for:</strong> {template.useCase}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.structure.map((part, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'phrases':
        return (
          <div className="space-y-4">
            {content.categories.map((category, index) => (
              <Card key={index} className="border border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Quote className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">{category.name}</h4>
                  </div>
                  <p className="text-xs text-purple-600 mb-3">{category.usage}</p>
                  <div className="space-y-2">
                    {category.phrases.map((phrase, idx) => (
                      <div key={idx} className="text-sm bg-purple-50 p-2 rounded italic">
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'citations':
        return (
          <div className="space-y-4">
            {content.formats.map((format, index) => (
              <Card key={index} className="border border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">{format.name} Format</h4>
                    <Badge variant="secondary">{format.description}</Badge>
                  </div>
                  <p className="text-sm text-green-600 mb-3"><strong>Use for:</strong> {format.useCase}</p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-700 mb-1"><strong>Example:</strong></p>
                    <p className="text-sm font-mono">{format.example}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-4">
            {content.features.map((feature, index) => (
              <Card key={index} className="border border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-1">{feature.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <p className="text-xs text-orange-600"><strong>Benefit:</strong> {feature.benefit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'shortcuts':
        return (
          <div className="space-y-4">
            {['Essential', 'Templates', 'Academic', 'Help'].map(category => (
              <div key={category}>
                <h4 className="font-semibold text-gray-800 mb-2">{category}</h4>
                <div className="space-y-2">
                  {content.shortcuts
                    .filter(shortcut => shortcut.category === category)
                    .map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{shortcut.action}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {shortcut.keys}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )

      case 'mobile':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">
                Write your essays on any device! Our mobile-friendly design makes it easy to write on the go.
              </p>
            </div>
            <div className="grid gap-3">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'completion':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Congratulations! 🎉</h3>
              <p className="text-gray-600">
                You've completed the onboarding and are ready to write amazing essays!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-800 mb-3">What You've Learned:</h4>
                <div className="grid gap-2">
                  {content.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-green-800 text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 mb-3">Next Steps:</h4>
                <div className="space-y-2">
                  {content.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-blue-800 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Step content not found</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <currentStepData.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-left">{currentStepData.title}</DialogTitle>
                  <DialogDescription className="text-left">
                    {currentStepData.description}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                Skip Tour
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex justify-center py-4 border-b">
            <div className="flex items-center gap-2 overflow-x-auto">
              {ONBOARDING_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    index === currentStep
                      ? 'bg-blue-600 text-white'
                      : index < currentStep || completedSteps.includes(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={index > currentStep}
                >
                  {index < currentStep || completedSteps.includes(index) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              {renderStepContent()}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  <PartyPopper className="w-4 h-4 mr-2" />
                  Start Writing!
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}