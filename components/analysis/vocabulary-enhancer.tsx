'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react'

// Types from the vocabulary analysis library
interface VocabularySuggestion {
  originalWord: string
  suggestions: string[]
  context: string
  reason: 'academic-upgrade' | 'precision' | 'formality' | 'variety' | 'clarity'
  priority: 'high' | 'medium' | 'low'
  explanation: string
  position: {
    start: number
    end: number
  }
}

interface VocabularyAnalysis {
  totalWords: number
  uniqueWords: number
  academicWords: number
  informalWords: number
  repetitiveWords: string[]
  vocabularyDiversity: number
  academicLevel: 'elementary' | 'middle-school' | 'high-school' | 'college'
  suggestions: VocabularySuggestion[]
}

interface VocabularyEnhancement {
  analysis: VocabularyAnalysis
  overallScore: number
  strengths: string[]
  improvementAreas: string[]
  recommendations: string[]
}

interface VocabularyEnhancerProps {
  text?: string
  targetLevel?: 'high-school' | 'college'
  isLoading?: boolean
  onApplySuggestion?: (suggestion: VocabularySuggestion, selectedWord: string) => void
  onRefresh?: () => void
  onAnalyze?: () => void
  className?: string
}

// Sample data for demonstration when no real data is provided
const SAMPLE_ENHANCEMENT: VocabularyEnhancement = {
  analysis: {
    totalWords: 250,
    uniqueWords: 180,
    academicWords: 45,
    informalWords: 8,
    repetitiveWords: ['really', 'very', 'good'],
    vocabularyDiversity: 72,
    academicLevel: 'high-school',
    suggestions: [
      {
        originalWord: 'really',
        suggestions: ['significantly', 'considerably', 'substantially'],
        context: 'This is really important for understanding the concept.',
        reason: 'academic-upgrade',
        priority: 'high',
        explanation: 'Replace informal intensifier with academic alternative',
        position: { start: 8, end: 14 }
      },
      {
        originalWord: 'good',
        suggestions: ['effective', 'beneficial', 'advantageous'],
        context: 'This method is good for solving the problem.',
        reason: 'precision',
        priority: 'medium',
        explanation: 'Use more precise academic vocabulary',
        position: { start: 15, end: 19 }
      },
      {
        originalWord: 'big',
        suggestions: ['substantial', 'significant', 'considerable'],
        context: 'There was a big difference in the results.',
        reason: 'formality',
        priority: 'medium',
        explanation: 'Replace casual language with formal academic terms',
        position: { start: 12, end: 15 }
      }
    ]
  },
  overallScore: 75,
  strengths: [
    'Good variety in sentence structure',
    'Appropriate use of transition words',
    'Strong academic vocabulary foundation'
  ],
  improvementAreas: [
    'Reduce use of informal intensifiers',
    'Increase precision in word choice',
    'Vary vocabulary to avoid repetition'
  ],
  recommendations: [
    'Replace informal words with academic alternatives',
    'Use more specific vocabulary instead of general terms',
    'Consider using transition words to improve flow'
  ]
}

const VocabularyEnhancer: React.FC<VocabularyEnhancerProps> = ({
  text,
  targetLevel = 'high-school',
  isLoading = false,
  onApplySuggestion,
  onRefresh,
  onAnalyze,
  className = ''
}) => {
  const [enhancement, setEnhancement] = useState<VocabularyEnhancement | null>(null)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  // Analyze vocabulary when text changes
  useEffect(() => {
    if (text && text.length > 0) {
      analyzeVocabulary(text)
    } else {
      // Use sample data for demonstration
      setEnhancement(SAMPLE_ENHANCEMENT)
    }
  }, [text, targetLevel])

  const analyzeVocabulary = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze) return

    try {
      const response = await fetch('/api/analysis/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          targetLevel,
          analysisType: 'full'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setEnhancement(result)
      } else {
        console.error('Failed to analyze vocabulary')
        setEnhancement(SAMPLE_ENHANCEMENT) // Fallback to sample data
      }
    } catch (error) {
      console.error('Error analyzing vocabulary:', error)
      setEnhancement(SAMPLE_ENHANCEMENT) // Fallback to sample data
    }
  }, [targetLevel])

  const handleApplySuggestion = (suggestion: VocabularySuggestion, selectedWord: string) => {
    // Mark as applied
    const key = `${suggestion.originalWord}-${suggestion.position.start}`
    setAppliedSuggestions(prev => new Set([...prev, key]))
    
    // Call parent handler
    if (onApplySuggestion) {
      onApplySuggestion(suggestion, selectedWord)
    }
  }

  const isSuggestionApplied = (suggestion: VocabularySuggestion): boolean => {
    const key = `${suggestion.originalWord}-${suggestion.position.start}`
    return appliedSuggestions.has(key)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'academic-upgrade': return 'Academic Style'
      case 'precision': return 'Precision'
      case 'formality': return 'Formality'
      case 'variety': return 'Variety'
      case 'clarity': return 'Clarity'
      default: return 'Enhancement'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Vocabulary Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!enhancement) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Vocabulary Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Start typing to get vocabulary enhancement suggestions
            </p>
            {onAnalyze && (
              <Button onClick={onAnalyze} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Analyze Text
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Vocabulary Enhancement
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getScoreBadgeColor(enhancement.overallScore)}>
              Score: {enhancement.overallScore}/100
            </Badge>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({enhancement.analysis.suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="recommendations">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(enhancement.overallScore)}`}>
                        {enhancement.overallScore}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Academic Words</p>
                      <p className="text-2xl font-bold text-green-600">
                        {enhancement.analysis.academicWords}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Diversity</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {enhancement.analysis.vocabularyDiversity}%
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Level</p>
                      <p className="text-lg font-semibold text-purple-600 capitalize">
                        {enhancement.analysis.academicLevel.replace('-', ' ')}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strengths and Areas for Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {enhancement.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {enhancement.improvementAreas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {enhancement.analysis.suggestions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Great! No vocabulary improvements needed at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {enhancement.analysis.suggestions.map((suggestion, index) => (
                  <Card key={index} className={`border-l-4 ${
                    suggestion.priority === 'high' ? 'border-l-red-500' :
                    suggestion.priority === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  } ${isSuggestionApplied(suggestion) ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(suggestion.priority)}
                            <Badge variant="outline">
                              {getReasonLabel(suggestion.reason)}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {suggestion.priority} Priority
                            </Badge>
                            {isSuggestionApplied(suggestion) && (
                              <Badge className="bg-green-100 text-green-800">
                                Applied
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">Replace:</p>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono text-sm">
                              {suggestion.originalWord}
                            </span>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">With:</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.suggestions.map((word, wordIndex) => (
                                <Button
                                  key={wordIndex}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 border-green-200 hover:bg-green-100"
                                  onClick={() => handleApplySuggestion(suggestion, word)}
                                  disabled={isSuggestionApplied(suggestion)}
                                >
                                  {word}
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Context:</strong> "{suggestion.context}"
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <strong>Why:</strong> {suggestion.explanation}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Word Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Words:</span>
                    <span className="font-semibold">{enhancement.analysis.totalWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Words:</span>
                    <span className="font-semibold">{enhancement.analysis.uniqueWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Academic Words:</span>
                    <span className="font-semibold text-green-600">{enhancement.analysis.academicWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Informal Words:</span>
                    <span className="font-semibold text-red-600">{enhancement.analysis.informalWords}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Vocabulary Diversity:</span>
                      <span className="font-semibold">{enhancement.analysis.vocabularyDiversity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${enhancement.analysis.vocabularyDiversity}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Academic Level:</span>
                      <span className="font-semibold capitalize">
                        {enhancement.analysis.academicLevel.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {enhancement.analysis.repetitiveWords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Repetitive Words</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enhancement.analysis.repetitiveWords.map((word, index) => (
                      <Badge key={index} variant="outline" className="bg-yellow-50">
                        {word}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Consider varying these frequently used words for better writing flow.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Writing Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {enhancement.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Academic Writing Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Word Choice</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use precise, specific vocabulary instead of general terms</li>
                      <li>• Replace informal language with academic alternatives</li>
                      <li>• Vary your word choice to avoid repetition</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Academic Style</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use formal language appropriate for academic writing</li>
                      <li>• Incorporate discipline-specific terminology</li>
                      <li>• Use transition words to connect ideas clearly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default VocabularyEnhancer 