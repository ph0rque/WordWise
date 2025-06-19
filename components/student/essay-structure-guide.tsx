"use client"

import { useState } from "react"
import {
  FileText,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Circle,
  Lightbulb,
  ArrowRight,
  Target,
  Users,
  Zap,
  Award,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface EssayStructureGuideProps {
  onInsertTemplate?: (template: string) => void
  onInsertSection?: (section: string) => void
  selectedEssayType?: string
  currentProgress?: {
    completedSections: string[]
    totalSections: number
  }
}

// Comprehensive essay templates with detailed guidance
const ESSAY_TEMPLATES = {
  'five-paragraph': {
    name: '5-Paragraph Essay',
    description: 'Classic structure for persuasive and expository writing',
    difficulty: 'Beginner',
    timeEstimate: '45-60 minutes',
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Hook your reader and present your thesis',
        structure: [
          { element: 'Hook', description: 'Attention-grabbing opening (question, quote, statistic, anecdote)' },
          { element: 'Background', description: 'Context and background information about your topic' },
          { element: 'Thesis Statement', description: 'Your main argument that previews your three main points' }
        ],
        tips: [
          'Start with something surprising or thought-provoking',
          'Keep background information brief but necessary',
          'Your thesis should clearly state your position and preview your main points'
        ],
        examples: [
          'Hook: "Did you know that the average teenager spends 7 hours a day on screens?"',
          'Thesis: "School uniforms should be mandatory because they reduce bullying, improve focus, and promote equality."'
        ]
      },
      {
        id: 'body1',
        name: 'Body Paragraph 1',
        description: 'Your strongest supporting argument',
        structure: [
          { element: 'Topic Sentence', description: 'Introduce your first main point' },
          { element: 'Evidence', description: 'Facts, statistics, quotes, or examples' },
          { element: 'Analysis', description: 'Explain how your evidence proves your point' },
          { element: 'Transition', description: 'Connect to your next paragraph' }
        ],
        tips: [
          'Put your strongest argument first',
          'Use specific, credible evidence',
          'Explain the significance of your evidence',
          'Use transition words to maintain flow'
        ]
      },
      {
        id: 'body2',
        name: 'Body Paragraph 2',
        description: 'Your second supporting argument',
        structure: [
          { element: 'Topic Sentence', description: 'Introduce your second main point' },
          { element: 'Evidence', description: 'Facts, statistics, quotes, or examples' },
          { element: 'Analysis', description: 'Explain how your evidence proves your point' },
          { element: 'Transition', description: 'Connect to your next paragraph' }
        ],
        tips: [
          'Make sure this point is different from your first',
          'Maintain the same level of detail as paragraph 1',
          'Use different types of evidence for variety'
        ]
      },
      {
        id: 'body3',
        name: 'Body Paragraph 3',
        description: 'Your third supporting argument',
        structure: [
          { element: 'Topic Sentence', description: 'Introduce your third main point' },
          { element: 'Evidence', description: 'Facts, statistics, quotes, or examples' },
          { element: 'Analysis', description: 'Explain how your evidence proves your point' },
          { element: 'Transition', description: 'Connect to your conclusion' }
        ],
        tips: [
          'This can be your most emotional or forward-looking point',
          'Prepare readers for your conclusion',
          'End with impact'
        ]
      },
      {
        id: 'conclusion',
        name: 'Conclusion',
        description: 'Wrap up and leave a lasting impression',
        structure: [
          { element: 'Restate Thesis', description: 'Rephrase your main argument (don\'t copy exactly)' },
          { element: 'Summarize Points', description: 'Briefly recap your three main arguments' },
          { element: 'Closing Thought', description: 'Call to action, prediction, or thought-provoking statement' }
        ],
        tips: [
          'Don\'t introduce new information',
          'Make your conclusion memorable',
          'End with a call to action or thought-provoking question'
        ]
      }
    ],
    template: `# [Your Essay Title]

## Introduction
**Hook:** [Write an attention-grabbing opening - try a surprising statistic, thought-provoking question, or relevant quote]

**Background:** [Provide 2-3 sentences of context about your topic - what does your reader need to know?]

**Thesis Statement:** [State your main argument and preview your three supporting points]

---

## Body Paragraph 1: [Your Strongest Point]
**Topic Sentence:** [Introduce your first main argument]

**Evidence:** [Provide specific facts, statistics, quotes, or examples that support this point]

**Analysis:** [Explain how this evidence proves your point - this is the most important part!]

**Transition:** [Connect this paragraph to the next with a transitional phrase]

---

## Body Paragraph 2: [Your Second Point]
**Topic Sentence:** [Introduce your second main argument]

**Evidence:** [Provide specific facts, statistics, quotes, or examples that support this point]

**Analysis:** [Explain how this evidence proves your point]

**Transition:** [Connect this paragraph to the next]

---

## Body Paragraph 3: [Your Third Point]
**Topic Sentence:** [Introduce your third main argument]

**Evidence:** [Provide specific facts, statistics, quotes, or examples that support this point]

**Analysis:** [Explain how this evidence proves your point]

**Transition:** [Prepare readers for your conclusion]

---

## Conclusion
**Restate Thesis:** [Rephrase your main argument - don't copy it exactly]

**Summarize Points:** [Briefly remind readers of your three main arguments]

**Closing Thought:** [End with a call to action, prediction, or thought-provoking statement that leaves a lasting impression]`
  },
  'argumentative': {
    name: 'Argumentative Essay',
    description: 'Persuade readers to accept your position on a controversial topic',
    difficulty: 'Intermediate',
    timeEstimate: '60-90 minutes',
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Present the controversy and your position',
        structure: [
          { element: 'Attention Grabber', description: 'Compelling opening that highlights the controversy' },
          { element: 'Issue Background', description: 'Context about the debate or problem' },
          { element: 'Your Position', description: 'Clearly state which side you support' },
          { element: 'Thesis Statement', description: 'Your main argument with preview of reasons' }
        ],
        tips: [
          'Choose a debatable topic with multiple perspectives',
          'Acknowledge that reasonable people disagree',
          'Make your position crystal clear',
          'Preview your strongest arguments'
        ]
      },
      {
        id: 'argument1',
        name: 'Argument 1 (Strongest)',
        description: 'Your most compelling reason',
        structure: [
          { element: 'Claim', description: 'State your argument clearly and directly' },
          { element: 'Evidence', description: 'Research, statistics, expert opinions, real examples' },
          { element: 'Warrant', description: 'Explain why this evidence supports your claim' },
          { element: 'Impact', description: 'Discuss why this argument matters' }
        ],
        tips: [
          'Lead with your strongest argument',
          'Use credible, recent sources',
          'Appeal to logic and emotion appropriately',
          'Show real-world consequences'
        ]
      },
      {
        id: 'argument2',
        name: 'Argument 2',
        description: 'Your second strongest reason',
        structure: [
          { element: 'Claim', description: 'State your second argument' },
          { element: 'Evidence', description: 'Different type of support from argument 1' },
          { element: 'Warrant', description: 'Connect evidence to your claim' },
          { element: 'Impact', description: 'Explain the significance' }
        ],
        tips: [
          'Use different types of evidence for variety',
          'Build on your first argument',
          'Maintain consistent strength of support'
        ]
      },
      {
        id: 'counterargument',
        name: 'Counter-argument & Rebuttal',
        description: 'Address and refute opposing views',
        structure: [
          { element: 'Opposing View', description: 'Present the strongest argument against your position' },
          { element: 'Their Reasoning', description: 'Fairly explain why opponents think this' },
          { element: 'Your Rebuttal', description: 'Refute their argument with evidence' },
          { element: 'Reinforce Position', description: 'Explain why your view is stronger' }
        ],
        tips: [
          'Be fair and respectful to opposing views',
          'Choose their strongest argument, not a weak one',
          'Use evidence to refute, not just opinion',
          'Show you understand both sides'
        ]
      },
      {
        id: 'conclusion',
        name: 'Conclusion',
        description: 'Reinforce your position and inspire action',
        structure: [
          { element: 'Restate Position', description: 'Remind readers of your stance' },
          { element: 'Summarize Arguments', description: 'Review your main points briefly' },
          { element: 'Call to Action', description: 'What should readers do with this information?' },
          { element: 'Final Appeal', description: 'Emotional or logical final push' }
        ],
        tips: [
          'Make your conclusion actionable',
          'Appeal to readers\' values',
          'End with urgency or importance',
          'Make it memorable'
        ]
      }
    ],
    template: `# [Your Argumentative Essay Title]

## Introduction
**Attention Grabber:** [Start with a compelling statistic, scenario, or question that highlights the controversy]

**Issue Background:** [Provide context about the debate - why do people disagree about this?]

**Your Position:** [Clearly state which side you're arguing for]

**Thesis Statement:** [Present your main argument with a preview of your supporting reasons]

---

## Argument 1: [Your Strongest Point]
**Claim:** [State your most compelling argument clearly]

**Evidence:** [Provide research, statistics, expert opinions, or real-world examples]

**Warrant:** [Explain exactly how this evidence supports your claim]

**Impact:** [Discuss why this argument is significant - what are the consequences?]

---

## Argument 2: [Your Second Point]
**Claim:** [State your second argument]

**Evidence:** [Provide different types of support - vary your evidence types]

**Warrant:** [Connect your evidence to your claim clearly]

**Impact:** [Explain the importance and implications]

---

## Counter-argument & Rebuttal
**Opposing View:** [Present the strongest argument against your position fairly and respectfully]

**Their Reasoning:** [Explain why reasonable people might hold this opposing view]

**Your Rebuttal:** [Refute their argument using evidence and logic]

**Why Your View is Stronger:** [Explain why your position is more compelling]

---

## Conclusion
**Restate Position:** [Remind readers of your stance without copying your thesis exactly]

**Summarize Arguments:** [Briefly review your main supporting points]

**Call to Action:** [Tell readers what they should do with this information]

**Final Appeal:** [End with a compelling emotional or logical appeal that will stick with readers]`
  },
  'literary-analysis': {
    name: 'Literary Analysis',
    description: 'Analyze themes, characters, or literary devices in literature',
    difficulty: 'Intermediate',
    timeEstimate: '60-75 minutes',
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Introduce the work and your analytical focus',
        structure: [
          { element: 'Author & Work', description: 'Title, author, and brief context' },
          { element: 'Brief Summary', description: 'Essential plot points (no spoilers!)' },
          { element: 'Analytical Focus', description: 'What literary element you\'re analyzing' },
          { element: 'Thesis Statement', description: 'Your main insight about the work' }
        ],
        tips: [
          'Assume readers know the basic plot',
          'Focus on analysis, not summary',
          'Choose a specific literary element to analyze',
          'Make an arguable claim about the work\'s meaning'
        ]
      },
      {
        id: 'analysis1',
        name: 'Analysis Point 1',
        description: 'First aspect of your literary analysis',
        structure: [
          { element: 'Topic Focus', description: 'What specific element you\'re analyzing' },
          { element: 'Textual Evidence', description: 'Direct quotes or specific scenes' },
          { element: 'Literary Device', description: 'Identify techniques the author uses' },
          { element: 'Interpretation', description: 'What this reveals about meaning/theme' }
        ],
        tips: [
          'Use specific quotes as evidence',
          'Identify literary devices (symbolism, irony, etc.)',
          'Connect analysis to larger themes',
          'Avoid plot summary'
        ]
      }
    ],
    template: `# Literary Analysis: [Work Title]

## Introduction
**Author & Work:** [Introduce author, title, and publication context]

**Brief Context:** [Provide essential background without spoiling plot]

**Analytical Focus:** [State what literary element you're analyzing - theme, character, symbolism, etc.]

**Thesis Statement:** [Your main insight about what the work reveals or how it achieves its effect]

---

## Analysis Point 1: [Literary Element]
**Focus:** [What specific aspect you're analyzing]

**Textual Evidence:** [Specific quotes or scenes from the text]

**Literary Device:** [Identify the techniques - metaphor, symbolism, irony, etc.]

**Interpretation:** [Explain what this reveals about the work's deeper meaning]

**Significance:** [Why this analysis matters to understanding the work]

---

## Analysis Point 2: [Literary Element]
**Focus:** [Second aspect of your analysis]

**Textual Evidence:** [Different quotes or scenes]

**Literary Device:** [Author's techniques]

**Interpretation:** [Your analysis of meaning]

**Significance:** [Connection to themes]

---

## Analysis Point 3: [Literary Element]
**Focus:** [Third analytical point]

**Textual Evidence:** [Supporting quotes]

**Literary Device:** [Literary techniques]

**Interpretation:** [Your interpretation]

**Significance:** [Broader implications]

---

## Conclusion
**Synthesis:** [How all your analysis points work together]

**Broader Meaning:** [What this reveals about human nature, society, or universal themes]

**Lasting Impact:** [Why this work and your analysis matter today]`
  },
  'compare-contrast': {
    name: 'Compare & Contrast Essay',
    description: 'Analyze similarities and differences between two subjects',
    difficulty: 'Intermediate',
    timeEstimate: '60-75 minutes',
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Introduce both subjects and your comparison focus',
        structure: [
          { element: 'Hook', description: 'Interesting opening about your subjects' },
          { element: 'Subject Introduction', description: 'Briefly introduce both subjects' },
          { element: 'Comparison Focus', description: 'What aspects you\'re comparing' },
          { element: 'Thesis Statement', description: 'Your main point about the comparison' }
        ]
      }
    ],
    template: `# Comparing [Subject A] and [Subject B]

## Introduction
**Hook:** [Interesting opening that highlights why this comparison matters]

**Subject Introduction:** [Briefly introduce both subjects you're comparing]

**Comparison Focus:** [Explain what specific aspects you'll compare]

**Thesis Statement:** [Your main point about the similarities and/or differences]

---

## Similarities
### Point 1: [How they're alike]
**Subject A:** [Specific details about first subject]
**Subject B:** [Specific details about second subject]
**Analysis:** [Why this similarity is significant]

### Point 2: [Second similarity]
**Subject A:** [Details]
**Subject B:** [Details]
**Analysis:** [Significance]

---

## Differences
### Point 1: [Key difference]
**Subject A:** [How first subject approaches this]
**Subject B:** [How second subject approaches this]
**Analysis:** [Why this difference matters]

### Point 2: [Second difference]
**Subject A:** [Details]
**Subject B:** [Details]
**Analysis:** [Significance]

---

## Conclusion
**Summary:** [Review key similarities and differences]
**Significance:** [Why these comparisons matter]
**Final Insight:** [What we learn from this analysis]`
  }
}

// Section completion tracking
const SECTION_ICONS = {
  introduction: BookOpen,
  body1: FileText,
  body2: FileText,
  body3: FileText,
  argument1: Target,
  argument2: Target,
  counterargument: Users,
  analysis1: Zap,
  analysis2: Zap,
  analysis3: Zap,
  conclusion: Award
}

export function EssayStructureGuide({ 
  onInsertTemplate, 
  onInsertSection, 
  selectedEssayType = 'five-paragraph',
  currentProgress 
}: EssayStructureGuideProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState(selectedEssayType)

  const currentTemplate = ESSAY_TEMPLATES[selectedTemplate as keyof typeof ESSAY_TEMPLATES]
  const completedSections = currentProgress?.completedSections || []
  const progressPercentage = currentProgress ? (completedSections.length / currentProgress.totalSections) * 100 : 0

  const handleInsertFullTemplate = () => {
    if (onInsertTemplate && currentTemplate) {
      onInsertTemplate(currentTemplate.template)
    }
  }

  const handleInsertSection = (sectionId: string) => {
    if (onInsertSection) {
      const section = currentTemplate.sections.find(s => s.id === sectionId)
      if (section) {
        // Create a focused template for just this section
        const sectionTemplate = createSectionTemplate(section)
        onInsertSection(sectionTemplate)
      }
    }
  }

  const createSectionTemplate = (section: any) => {
    let template = `## ${section.name}\n`
    template += `<!-- ${section.description} -->\n\n`
    
    section.structure.forEach((element: any) => {
      template += `**${element.element}:** [${element.description}]\n\n`
    })
    
    return template
  }

  const getSectionIcon = (sectionId: string) => {
    const IconComponent = SECTION_ICONS[sectionId as keyof typeof SECTION_ICONS] || Circle
    return IconComponent
  }

  const isSectionCompleted = (sectionId: string) => {
    return completedSections.includes(sectionId)
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Essay Structure Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {Object.entries(ESSAY_TEMPLATES).map(([key, template]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {template.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(ESSAY_TEMPLATES).map(([key, template]) => (
              <TabsContent key={key} value={key} className="space-y-4 mt-6">
                {/* Template Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">
                          {template.difficulty}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Difficulty Level
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">
                          {template.timeEstimate}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Estimated Time
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">
                          {template.sections.length} sections
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Structure Parts
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{template.name}:</strong> {template.description}
                  </AlertDescription>
                </Alert>

                {/* Progress Tracking */}
                {currentProgress && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Writing Progress</span>
                        <span className="text-sm text-gray-600">
                          {completedSections.length} of {currentProgress.totalSections} sections
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </CardContent>
                  </Card>
                )}

                {/* Section-by-Section Guide */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Step-by-Step Structure</h3>
                    <Button onClick={handleInsertFullTemplate} size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Insert Full Template
                    </Button>
                  </div>

                  {template.sections.map((section, index) => {
                    const IconComponent = getSectionIcon(section.id)
                    const isCompleted = isSectionCompleted(section.id)
                    const isActive = activeSection === section.id

                    return (
                      <Card 
                        key={section.id} 
                        className={`transition-all ${
                          isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 
                          isActive ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <CardHeader 
                          className="cursor-pointer"
                          onClick={() => setActiveSection(isActive ? null : section.id)}
                        >
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className={`p-2 rounded-full ${
                                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  ) : (
                                    <IconComponent className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <span className="text-base">
                                  Step {index + 1}: {section.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleInsertSection(section.id)
                                }}
                              >
                                Insert Section
                              </Button>
                              {isActive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {section.description}
                          </p>
                        </CardHeader>

                        {isActive && (
                          <CardContent className="space-y-4">
                            {/* Structure Elements */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center">
                                <Target className="h-4 w-4 mr-2" />
                                What to Include:
                              </h4>
                              <div className="space-y-2">
                                {section.structure.map((element: any, elemIndex: number) => (
                                  <div key={elemIndex} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="font-medium text-sm">{element.element}</div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {element.description}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Writing Tips */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center">
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Writing Tips:
                              </h4>
                              <ul className="space-y-1">
                                {section.tips.map((tip: string, tipIndex: number) => (
                                  <li key={tipIndex} className="flex items-start space-x-2 text-sm">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Examples (if available) */}
                            {section.examples && (
                              <div>
                                <h4 className="font-medium mb-3 flex items-center">
                                  <Award className="h-4 w-4 mr-2" />
                                  Examples:
                                </h4>
                                <div className="space-y-2">
                                  {section.examples.map((example: string, exampleIndex: number) => (
                                    <div key={exampleIndex} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                                      <p className="text-sm italic">"{example}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 