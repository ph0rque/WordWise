'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  AlertCircle,
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
    academicWords: 0,
    informalWords: 8,
    repetitiveWords: ['really', 'very', 'good'],
    vocabularyDiversity: 34,
    academicLevel: 'elementary',
    suggestions: [
      {
        originalWord: 'Essay Structure',
        suggestions: ['Add topic sentences', 'Strengthen transitions', 'Improve conclusion'],
        context: 'Your essay would benefit from clearer paragraph structure and stronger connecting ideas.',
        reason: 'academic-upgrade',
        priority: 'high',
        explanation: 'Enhance overall essay organization and flow',
        position: { start: 0, end: 0 }
      },
      {
        originalWord: 'Academic Vocabulary',
        suggestions: ['Use formal language', 'Add subject-specific terms', 'Replace casual words'],
        context: 'Consider elevating your vocabulary to match academic writing standards.',
        reason: 'formality',
        priority: 'high',
        explanation: 'Strengthen academic tone and precision',
        position: { start: 0, end: 0 }
      },
      {
        originalWord: 'Evidence & Examples',
        suggestions: ['Add supporting details', 'Include specific examples', 'Cite relevant sources'],
        context: 'Your arguments would be stronger with more concrete evidence and examples.',
        reason: 'precision',
        priority: 'medium',
        explanation: 'Strengthen arguments with better support',
        position: { start: 0, end: 0 }
      },
      {
        originalWord: 'Sentence Variety',
        suggestions: ['Vary sentence length', 'Use complex sentences', 'Improve rhythm'],
        context: 'Mix short and long sentences to create better flow and engagement.',
        reason: 'variety',
        priority: 'medium',
        explanation: 'Enhance readability and writing style',
        position: { start: 0, end: 0 }
      }
    ]
  },
  overallScore: 25,
  strengths: [
    'Good sentence structure',
    'Appropriate paragraph length'
  ],
  improvementAreas: [
    'Limited academic vocabulary usage',
    'Limited vocabulary variety'
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

  // Analyze vocabulary when text changes
  useEffect(() => {
    if (text && text.length > 0) {
      console.log('Analyzing vocabulary for text:', text.substring(0, 100) + '...')
      analyzeVocabulary(text)
    } else {
      // Use sample data for demonstration
      console.log('Using sample vocabulary data')
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
        // Sanitize the result to remove any HTML markup
        const sanitizedResult = sanitizeEnhancementData(result)
        setEnhancement(sanitizedResult)
      } else {
        console.error('Failed to analyze vocabulary')
        setEnhancement(SAMPLE_ENHANCEMENT) // Fallback to sample data
      }
    } catch (error) {
      console.error('Error analyzing vocabulary:', error)
      setEnhancement(SAMPLE_ENHANCEMENT) // Fallback to sample data
    }
  }, [targetLevel])

  // Function to sanitize enhancement data and remove HTML markup
  const sanitizeEnhancementData = (data: VocabularyEnhancement): VocabularyEnhancement => {
    const stripHtml = (text: string): string => {
      if (!text || typeof text !== 'string') return ''
      return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim()
    }

    try {
      console.log('Sanitizing vocabulary data:', data)
      
      const sanitized = {
        ...data,
        analysis: {
          ...data.analysis,
          suggestions: data.analysis.suggestions.map(suggestion => ({
            ...suggestion,
            originalWord: stripHtml(suggestion.originalWord),
            suggestions: suggestion.suggestions.map(s => stripHtml(s)),
            context: stripHtml(suggestion.context),
            explanation: stripHtml(suggestion.explanation)
          }))
        },
        strengths: data.strengths.map(s => stripHtml(s)),
        improvementAreas: data.improvementAreas.map(s => stripHtml(s)),
        recommendations: data.recommendations.map(s => stripHtml(s))
      }
      
      console.log('Sanitized vocabulary data:', sanitized)
      return sanitized
    } catch (error) {
      console.error('Error sanitizing vocabulary data:', error)
      // Return sample data as fallback
      return SAMPLE_ENHANCEMENT
    }
  }



  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const truncateWord = (word: string, maxLength: number = 12) => {
    if (word.length <= maxLength) return word
    return word.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vocabulary Enhancement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!enhancement) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vocabulary Enhancement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Start typing to get vocabulary suggestions
            </p>
            {onAnalyze && (
              <Button onClick={onAnalyze} variant="outline" size="sm">
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vocabulary Enhancement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Overall Score</div>
            <div className="text-2xl font-bold" style={{ color: getScoreColor(enhancement.overallScore) }}>
              {enhancement.overallScore}
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Academic Words</div>
            <div className="text-2xl font-bold text-green-600">
              {enhancement.analysis.academicWords}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Diversity</div>
            <div className="text-lg font-semibold text-blue-600">
              {enhancement.analysis.vocabularyDiversity}%
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Level</div>
            <div className="text-sm font-semibold text-purple-600 capitalize">
              {enhancement.analysis.academicLevel.replace('-', ' ')}
            </div>
          </div>
        </div>



        {/* Quick Stats */}
        <div className="border-t pt-3">
          <div className="text-sm font-medium mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{enhancement.analysis.totalWords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unique:</span>
              <span className="font-medium">{enhancement.analysis.uniqueWords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Informal:</span>
              <span className="font-medium text-red-600">{enhancement.analysis.informalWords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Repetitive:</span>
              <span className="font-medium text-yellow-600">{enhancement.analysis.repetitiveWords.length}</span>
            </div>
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Areas for Improvement</span>
          </div>
          <ul className="space-y-1">
            {enhancement.improvementAreas.slice(0, 2).map((area, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-orange-500 flex-shrink-0">•</span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default VocabularyEnhancer 