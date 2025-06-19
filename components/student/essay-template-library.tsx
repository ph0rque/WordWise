"use client"

import { useState } from "react"
import {
  FileText,
  BookOpen,
  Search,
  Filter,
  Clock,
  Award,
  Target,
  Users,
  Zap,
  ChevronRight,
  Info,
  Download,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EssayTemplateLibraryProps {
  onSelectTemplate?: (template: EssayTemplate) => void
  onPreviewTemplate?: (template: EssayTemplate) => void
}

interface EssayTemplate {
  id: string
  name: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  timeEstimate: string
  description: string
  subjects: string[]
  keywords: string[]
  template: string
  structure: string[]
  tips: string[]
  examples?: string[]
}

// Comprehensive template library for high school students
const ESSAY_TEMPLATES: EssayTemplate[] = [
  {
    id: 'five-paragraph',
    name: '5-Paragraph Essay',
    category: 'Persuasive',
    difficulty: 'Beginner',
    timeEstimate: '45-60 min',
    description: 'The classic essay structure perfect for most persuasive and expository writing assignments.',
    subjects: ['English', 'History', 'Social Studies'],
    keywords: ['persuasive', 'expository', 'opinion', 'argument'],
    structure: ['Introduction', 'Body Paragraph 1', 'Body Paragraph 2', 'Body Paragraph 3', 'Conclusion'],
    tips: [
      'Put your strongest argument first',
      'Use specific evidence in each body paragraph',
      'Connect each paragraph with transitions',
      'End with a memorable conclusion'
    ],
    template: `# [Your Essay Title]

## Introduction
**Hook:** [Attention-grabbing opening - question, quote, statistic, or anecdote]
**Background:** [Brief context about your topic - what should readers know?]
**Thesis Statement:** [Your main argument with preview of three supporting points]

## Body Paragraph 1: [Your Strongest Point]
**Topic Sentence:** [Introduce your first main argument clearly]
**Evidence:** [Specific facts, statistics, quotes, or examples that support this point]
**Analysis:** [Explain how this evidence proves your point - connect evidence to argument]
**Transition:** [Smooth connection to your next paragraph]

## Body Paragraph 2: [Your Second Point]
**Topic Sentence:** [Introduce your second main argument]
**Evidence:** [Different type of support from paragraph 1 - vary your evidence]
**Analysis:** [Explain the significance and connection to your thesis]
**Transition:** [Bridge to your final argument]

## Body Paragraph 3: [Your Third Point]
**Topic Sentence:** [Introduce your third main argument]
**Evidence:** [Strong supporting details that reinforce your position]
**Analysis:** [Explain why this evidence matters and supports your thesis]
**Transition:** [Prepare readers for your conclusion]

## Conclusion
**Restate Thesis:** [Rephrase your main argument - don't copy exactly]
**Summarize Points:** [Briefly remind readers of your three main arguments]
**Closing Thought:** [Call to action, prediction, or thought-provoking statement that leaves lasting impact]`
  },
  {
    id: 'argumentative',
    name: 'Argumentative Essay',
    category: 'Persuasive',
    difficulty: 'Intermediate',
    timeEstimate: '60-90 min',
    description: 'Take a stance on a controversial issue and persuade readers to accept your position.',
    subjects: ['English', 'History', 'Social Studies', 'Current Events'],
    keywords: ['debate', 'controversial', 'persuade', 'position', 'counter-argument'],
    structure: ['Introduction', 'Argument 1', 'Argument 2', 'Counter-argument & Rebuttal', 'Conclusion'],
    tips: [
      'Choose a truly debatable topic',
      'Address counter-arguments fairly',
      'Use credible, recent sources',
      'Appeal to logic and emotion appropriately'
    ],
    template: `# [Your Argumentative Essay Title]

## Introduction
**Attention Grabber:** [Compelling opening that highlights the controversy - statistic, scenario, or question]
**Issue Background:** [Context about the debate - why do people disagree about this topic?]
**Your Position:** [Clearly state which side you're arguing for - no ambiguity]
**Thesis Statement:** [Your main argument with preview of supporting reasons]

## Argument 1: [Your Strongest Point]
**Claim:** [State your most compelling argument clearly and directly]
**Evidence:** [Research, statistics, expert opinions, or real-world examples]
**Warrant:** [Explain exactly how this evidence supports your claim]
**Impact:** [Discuss why this argument matters - what are the consequences?]

## Argument 2: [Your Second Point]
**Claim:** [State your second argument clearly]
**Evidence:** [Different types of support - vary your evidence for credibility]
**Warrant:** [Connect your evidence to your claim explicitly]
**Impact:** [Explain the significance and broader implications]

## Counter-argument & Rebuttal
**Opposing View:** [Present the strongest argument against your position fairly and respectfully]
**Their Reasoning:** [Explain why reasonable people might hold this opposing view]
**Your Rebuttal:** [Refute their argument using evidence and logic - not just opinion]
**Why Your View is Stronger:** [Explain why your position is more compelling or better supported]

## Conclusion
**Restate Position:** [Remind readers of your stance without copying your thesis exactly]
**Summarize Arguments:** [Briefly review your main supporting points]
**Call to Action:** [Tell readers what they should do with this information]
**Final Appeal:** [End with compelling emotional or logical appeal that will stick with readers]`
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast Essay',
    category: 'Analytical',
    difficulty: 'Intermediate',
    timeEstimate: '60-75 min',
    description: 'Analyze similarities and differences between two subjects to reveal deeper insights.',
    subjects: ['English', 'History', 'Science', 'Literature'],
    keywords: ['compare', 'contrast', 'similarities', 'differences', 'analyze'],
    structure: ['Introduction', 'Similarities', 'Differences', 'Analysis', 'Conclusion'],
    tips: [
      'Choose subjects that have meaningful connections',
      'Use parallel structure in comparisons',
      'Focus on significant similarities and differences',
      'Draw conclusions about what the comparison reveals'
    ],
    template: `# Comparing [Subject A] and [Subject B]

## Introduction
**Hook:** [Interesting opening that shows why this comparison matters]
**Subject Introduction:** [Briefly introduce both subjects you're comparing]
**Comparison Focus:** [Explain what specific aspects you'll analyze]
**Thesis Statement:** [Your main insight about what this comparison reveals]

## Similarities
### [Similarity 1]: [How they're alike]
**Subject A:** [Specific details about how first subject demonstrates this similarity]
**Subject B:** [Specific details about how second subject demonstrates this similarity]
**Analysis:** [Why this similarity is significant - what does it reveal?]

### [Similarity 2]: [Second way they're alike]
**Subject A:** [Details about first subject]
**Subject B:** [Details about second subject]
**Analysis:** [Significance of this connection]

## Differences
### [Difference 1]: [Key way they differ]
**Subject A:** [How first subject approaches or demonstrates this aspect]
**Subject B:** [How second subject approaches or demonstrates this aspect]
**Analysis:** [Why this difference matters - what does it show us?]

### [Difference 2]: [Second important difference]
**Subject A:** [Details about first subject's approach]
**Subject B:** [Details about second subject's approach]
**Analysis:** [What this difference reveals about each subject]

## Conclusion
**Summary:** [Review the most important similarities and differences]
**Deeper Insight:** [What does this comparison teach us about both subjects?]
**Broader Significance:** [Why does this analysis matter - what can we learn from it?]`
  },
  {
    id: 'cause-effect',
    name: 'Cause & Effect Essay',
    category: 'Analytical',
    difficulty: 'Intermediate',
    timeEstimate: '50-70 min',
    description: 'Explore the relationship between causes and their effects or consequences.',
    subjects: ['History', 'Science', 'Social Studies', 'Current Events'],
    keywords: ['causes', 'effects', 'consequences', 'results', 'because', 'therefore'],
    structure: ['Introduction', 'Cause 1', 'Cause 2', 'Cause 3', 'Effects/Results', 'Conclusion'],
    tips: [
      'Distinguish between immediate and long-term causes',
      'Show clear connections between causes and effects',
      'Use transitional words like "because," "therefore," "as a result"',
      'Consider multiple causes for complex effects'
    ],
    template: `# The Causes and Effects of [Your Topic]

## Introduction
**Hook:** [Engaging opening that highlights the importance of your topic]
**Background:** [Context about the situation or phenomenon you're analyzing]
**Focus:** [Whether you're focusing on causes, effects, or both]
**Thesis Statement:** [Your main point about the cause-effect relationship]

## Primary Cause: [Most Important Cause]
**Explanation:** [Describe this cause clearly and specifically]
**Evidence:** [Examples, data, or research that demonstrates this cause]
**Connection:** [How this cause directly leads to the effect(s)]

## Secondary Cause: [Second Important Cause]
**Explanation:** [Describe this contributing factor]
**Evidence:** [Support with specific examples or data]
**Connection:** [Explain the cause-effect relationship]

## Contributing Cause: [Additional Factor]
**Explanation:** [Describe how this factor contributes]
**Evidence:** [Specific examples or evidence]
**Connection:** [Show the causal relationship]

## Effects/Consequences
### Immediate Effects: [Short-term results]
**Description:** [What happened right away?]
**Evidence:** [Specific examples of these immediate consequences]

### Long-term Effects: [Extended consequences]
**Description:** [What are the ongoing or future implications?]
**Evidence:** [Examples of lasting impact]

## Conclusion
**Summary:** [Review the main causes and effects you've discussed]
**Significance:** [Why understanding these relationships matters]
**Implications:** [What can we learn or predict from this analysis?]`
  },
  {
    id: 'literary-analysis',
    name: 'Literary Analysis Essay',
    category: 'Literary',
    difficulty: 'Intermediate',
    timeEstimate: '60-75 min',
    description: 'Analyze literary elements like themes, characters, or devices in a work of literature.',
    subjects: ['English', 'Literature'],
    keywords: ['theme', 'character', 'symbolism', 'literary devices', 'analysis'],
    structure: ['Introduction', 'Analysis Point 1', 'Analysis Point 2', 'Analysis Point 3', 'Conclusion'],
    tips: [
      'Use direct quotes as evidence',
      'Analyze, don\'t just summarize the plot',
      'Connect analysis to broader themes',
      'Identify specific literary devices'
    ],
    template: `# Literary Analysis: [Work Title] by [Author]

## Introduction
**Author & Work:** [Introduce the author, title, and brief publication context]
**Brief Context:** [Essential background without spoiling major plot points]
**Analytical Focus:** [What literary element you're analyzing - theme, character, symbolism, etc.]
**Thesis Statement:** [Your main insight about what the work reveals or how it achieves its effect]

## Analysis Point 1: [First Literary Element]
**Focus:** [What specific aspect you're analyzing in this paragraph]
**Textual Evidence:** [Direct quotes or specific scenes from the text that support your analysis]
**Literary Device:** [Identify techniques the author uses - metaphor, symbolism, irony, etc.]
**Interpretation:** [Explain what this reveals about the work's deeper meaning or themes]
**Significance:** [Why this analysis matters to understanding the work as a whole]

## Analysis Point 2: [Second Literary Element]
**Focus:** [Second aspect of your analysis - should build on or complement first point]
**Textual Evidence:** [Different quotes or scenes that support this analysis]
**Literary Device:** [Author's techniques and craft choices]
**Interpretation:** [Your analysis of what this means in the context of the work]
**Significance:** [Connection to broader themes or significance]

## Analysis Point 3: [Third Literary Element]
**Focus:** [Third analytical point that strengthens your overall argument]
**Textual Evidence:** [Strong supporting quotes or examples from the text]
**Literary Device:** [Literary techniques the author employs]
**Interpretation:** [Your interpretation of meaning and significance]
**Significance:** [How this supports your thesis and broader understanding]

## Conclusion
**Synthesis:** [How all your analysis points work together to support your thesis]
**Broader Meaning:** [What this reveals about human nature, society, or universal themes]
**Lasting Impact:** [Why this work and your analysis matter - relevance today]`
  },
  {
    id: 'research-paper',
    name: 'Research Paper',
    category: 'Research',
    difficulty: 'Advanced',
    timeEstimate: '2-3 hours',
    description: 'In-depth exploration of a topic using multiple credible sources and proper citations.',
    subjects: ['All subjects'],
    keywords: ['research', 'sources', 'citations', 'evidence', 'scholarly'],
    structure: ['Introduction', 'Literature Review', 'Main Arguments', 'Counter-arguments', 'Conclusion', 'Works Cited'],
    tips: [
      'Use credible, scholarly sources',
      'Take detailed notes with proper citations',
      'Organize research before writing',
      'Follow proper citation format (MLA, APA, etc.)'
    ],
    template: `# [Your Research Paper Title]

## Introduction
**Hook:** [Compelling opening that draws readers into your topic]
**Background:** [Context about your research topic - why is it important?]
**Research Question:** [The specific question your research addresses]
**Thesis Statement:** [Your main argument based on your research findings]
**Preview:** [Brief overview of how you'll support your thesis]

## Literature Review/Background Research
**Current Understanding:** [What do experts currently know about this topic?]
**Key Sources:** [Summary of most important research and findings]
**Research Gap:** [What questions remain unanswered? Where does your research fit?]

## Main Argument 1: [Your First Research-Based Point]
**Claim:** [Your argument based on research]
**Evidence:** [Data, studies, expert opinions that support this claim]
**Source Analysis:** [Evaluation of your sources - why are they credible?]
**Interpretation:** [What this evidence means for your overall argument]

## Main Argument 2: [Your Second Research-Based Point]
**Claim:** [Second argument supported by research]
**Evidence:** [Different types of sources and data]
**Source Analysis:** [Why these sources are reliable and relevant]
**Interpretation:** [How this supports your thesis]

## Counter-arguments and Limitations
**Alternative Viewpoints:** [What do critics or other researchers argue?]
**Your Response:** [How does your research address these concerns?]
**Limitations:** [What are the limits of your research or argument?]

## Conclusion
**Summary of Findings:** [What has your research revealed?]
**Thesis Reinforcement:** [Restate your main argument with new authority]
**Implications:** [What do your findings mean for the field or society?]
**Future Research:** [What questions remain? What should be studied next?]

## Works Cited
[Properly formatted citations according to required style guide]`
  }
]

const CATEGORIES = ['All', 'Persuasive', 'Analytical', 'Literary', 'Research']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']
const SUBJECTS = ['All', 'English', 'History', 'Science', 'Social Studies', 'Literature', 'Current Events']

export function EssayTemplateLibrary({ onSelectTemplate, onPreviewTemplate }: EssayTemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')

  // Filter templates based on search and filters
  const filteredTemplates = ESSAY_TEMPLATES.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty
    const matchesSubject = selectedSubject === 'All' || template.subjects.includes(selectedSubject)

    return matchesSearch && matchesCategory && matchesDifficulty && matchesSubject
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Persuasive': return Target
      case 'Analytical': return Zap
      case 'Literary': return BookOpen
      case 'Research': return Search
      default: return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Essay Template Library</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from {ESSAY_TEMPLATES.length} professionally designed templates for academic writing
          </p>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates by name, description, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              >
                {DIFFICULTIES.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              >
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTemplates.length} of {ESSAY_TEMPLATES.length} templates
        </p>
        {(searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedSubject !== 'All') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All')
              setSelectedDifficulty('All')
              setSelectedSubject('All')
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map(template => {
          const CategoryIcon = getCategoryIcon(template.category)
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center space-x-2">
                      <CategoryIcon className="h-5 w-5 text-blue-600" />
                      <span>{template.name}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Template Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{template.timeEstimate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>{template.structure.length} sections</span>
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Best for:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.subjects.map(subject => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Structure Preview */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Structure:</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {template.structure.join(' → ')}
                  </div>
                </div>

                {/* Key Tips Preview */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Key Tips:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {template.tips.slice(0, 2).map((tip, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-blue-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                    {template.tips.length > 2 && (
                      <li className="text-gray-400">...and {template.tips.length - 2} more tips</li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onPreviewTemplate?.(template)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate?.(template)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your search terms or filters to find more templates.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedDifficulty('All')
                setSelectedSubject('All')
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 