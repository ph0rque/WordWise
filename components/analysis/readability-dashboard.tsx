'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Target, BookOpen, AlertCircle, CheckCircle, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface ReadabilityMetrics {
  fleschScore: number
  fleschKincaidGrade: number
  colemanLiauIndex: number
  automatedReadabilityIndex: number
  gunningFogIndex: number
  smogIndex: number
  averageWordsPerSentence: number
  averageSyllablesPerWord: number
  complexWordsPercentage: number
  passiveVoicePercentage: number
  sentenceVariety: number
  readingTimeMinutes: number
}

export interface ReadabilityAnalysis {
  metrics: ReadabilityMetrics
  overallGrade: number
  difficulty: 'Very Easy' | 'Easy' | 'Fairly Easy' | 'Standard' | 'Fairly Difficult' | 'Difficult' | 'Very Difficult'
  targetAudience: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  score: number // 0-100
  wordCount: number
  sentenceCount: number
  paragraphCount: number
}

export interface ReadabilityTrend {
  date: string
  score: number
  gradeLevel: number
  wordCount: number
  difficulty: string
}

interface ReadabilityDashboardProps {
  analysis?: ReadabilityAnalysis
  trends?: ReadabilityTrend[]
  targetGradeLevel?: number
  isLoading?: boolean
  text?: string
  onAnalyze?: (text: string) => void
  onRefresh?: () => void
}

const DIFFICULTY_COLORS = {
  'Very Easy': '#10b981',
  'Easy': '#84cc16',
  'Fairly Easy': '#eab308',
  'Standard': '#f59e0b',
  'Fairly Difficult': '#f97316',
  'Difficult': '#ef4444',
  'Very Difficult': '#dc2626'
}

const ReadabilityDashboard: React.FC<ReadabilityDashboardProps> = ({
  analysis,
  trends = [],
  targetGradeLevel = 12,
  isLoading = false,
  text,
  onAnalyze,
  onRefresh
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [calculatedAnalysis, setCalculatedAnalysis] = useState<ReadabilityAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [userGrade, setUserGrade] = useState<number>(9) // Default to 9th grade

  // Fetch user's grade level from settings
  useEffect(() => {
    const fetchUserGrade = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.user_metadata?.grade) {
          const grade = parseInt(session.user.user_metadata.grade, 10)
          if (grade >= 9 && grade <= 12) {
            setUserGrade(grade)
          }
        }
      } catch (error) {
        console.error('Error fetching user grade:', error)
        // Keep default of 9th grade
      }
    }

    fetchUserGrade()
  }, [])

  // Calculate analysis when text changes
  useEffect(() => {
    if (text && text.trim().length > 0) {
      analyzeText(text)
    } else {
      setCalculatedAnalysis(null)
    }
  }, [text])

  const analyzeText = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) return

    setAnalyzing(true)
    try {
      // Use the new AI-powered feedback API
      const response = await fetch('/api/analysis/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          targetLevel: 'high-school',
          analysisType: 'comprehensive'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('AI Feedback result:', result)
        
        // Convert the AI feedback to our ReadabilityAnalysis format
        const aiAnalysis = result.analysis
        const convertedAnalysis: ReadabilityAnalysis = {
          metrics: {
            fleschScore: Math.max(0, Math.min(100, 206.835 - (1.015 * aiAnalysis.metrics.averageWordsPerSentence) - (84.6 * 1.5))), // Estimate Flesch
            fleschKincaidGrade: aiAnalysis.gradeLevel,
            colemanLiauIndex: aiAnalysis.gradeLevel + 1, // Estimate
            automatedReadabilityIndex: aiAnalysis.gradeLevel - 1, // Estimate
            gunningFogIndex: aiAnalysis.gradeLevel + 2, // Estimate
            smogIndex: aiAnalysis.gradeLevel, // Estimate
            averageWordsPerSentence: aiAnalysis.metrics.averageWordsPerSentence,
            averageSyllablesPerWord: 1.5, // Estimate
            complexWordsPercentage: Math.max(0, Math.min(50, aiAnalysis.metrics.academicVocabularyPercentage * 2)), // Estimate
            passiveVoicePercentage: 10, // Estimate
            sentenceVariety: 7, // Estimate
            readingTimeMinutes: aiAnalysis.metrics.readingTimeMinutes
          },
          overallGrade: aiAnalysis.gradeLevel,
          difficulty: aiAnalysis.difficulty,
          targetAudience: getTargetAudience(aiAnalysis.gradeLevel),
          strengths: aiAnalysis.strengths || [],
          improvements: aiAnalysis.areasForImprovement || [],
          recommendations: aiAnalysis.recommendations || [],
          score: aiAnalysis.overallScore,
          wordCount: aiAnalysis.metrics.wordCount,
          sentenceCount: aiAnalysis.metrics.sentenceCount,
          paragraphCount: Math.max(1, Math.floor(aiAnalysis.metrics.wordCount / 100)) // Estimate
        }
        setCalculatedAnalysis(convertedAnalysis)
      } else {
        console.error('Failed to get AI feedback, falling back to basic analysis')
        // Fallback to the original readability API
        await fallbackToBasicAnalysis(textToAnalyze)
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error)
      // Fallback to basic analysis
      await fallbackToBasicAnalysis(textToAnalyze)
    } finally {
      setAnalyzing(false)
    }
  }

  const fallbackToBasicAnalysis = async (textToAnalyze: string) => {
    try {
      const response = await fetch('/api/analysis/readability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          targetLevel: 'high-school',
          includeMetrics: false
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Convert the API response to our ReadabilityAnalysis format
        const convertedAnalysis: ReadabilityAnalysis = {
          metrics: {
            fleschScore: result.metrics.fleschReadingEase,
            fleschKincaidGrade: result.metrics.fleschKincaidGradeLevel,
            colemanLiauIndex: result.metrics.colemanLiauIndex,
            automatedReadabilityIndex: result.metrics.automatedReadabilityIndex,
            gunningFogIndex: result.metrics.gunningFogIndex,
            smogIndex: 0, // Not provided by API
            averageWordsPerSentence: result.metrics.averageWordsPerSentence,
            averageSyllablesPerWord: result.metrics.averageSyllablesPerWord,
            complexWordsPercentage: result.metrics.complexWordPercentage,
            passiveVoicePercentage: 0, // Not provided by API
            sentenceVariety: 0, // Not provided by API
            readingTimeMinutes: Math.ceil(result.metrics.wordCount / 200) // Estimate 200 words per minute
          },
          overallGrade: result.metrics.recommendedGradeLevel,
          difficulty: getDifficultyFromGrade(result.metrics.recommendedGradeLevel),
          targetAudience: getTargetAudience(result.metrics.recommendedGradeLevel),
          strengths: result.strengths || ['Analysis completed'],
          improvements: result.improvementAreas || ['Continue practicing'],
          recommendations: result.recommendations || ['Keep writing regularly'],
          score: Math.round(Math.max(0, Math.min(100, result.metrics.fleschReadingEase))), // Cap score between 0-100
          wordCount: result.metrics.wordCount,
          sentenceCount: result.metrics.sentenceCount,
          paragraphCount: result.metrics.paragraphCount
        }
        setCalculatedAnalysis(convertedAnalysis)
      }
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError)
      setCalculatedAnalysis(null)
    }
  }

  const getDifficultyFromGrade = (grade: number): ReadabilityAnalysis['difficulty'] => {
    if (grade <= 6) return 'Very Easy'
    if (grade <= 8) return 'Easy'
    if (grade <= 10) return 'Fairly Easy'
    if (grade <= 12) return 'Standard'
    if (grade <= 14) return 'Fairly Difficult'
    if (grade <= 16) return 'Difficult'
    return 'Very Difficult'
  }

  const getTargetAudience = (grade: number): string => {
    if (grade <= 6) return 'Elementary Students (Grades K-6)'
    if (grade <= 8) return 'Middle School Students (Grades 7-8)'
    if (grade <= 12) return 'High School Students (Grades 9-12)'
    return 'Adult Level'
  }

  // Sample data for demonstration when no real data is provided
  const sampleAnalysis: ReadabilityAnalysis = {
    metrics: {
      fleschScore: 65.2,
      fleschKincaidGrade: 8.5,
      colemanLiauIndex: 9.1,
      automatedReadabilityIndex: 8.8,
      gunningFogIndex: 10.2,
      smogIndex: 9.5,
      averageWordsPerSentence: 15.3,
      averageSyllablesPerWord: 1.6,
      complexWordsPercentage: 12.5,
      passiveVoicePercentage: 8.3,
      sentenceVariety: 7.2,
      readingTimeMinutes: 3.5
    },
    overallGrade: 9.0,
    difficulty: 'Standard',
    targetAudience: 'High School Students (Grades 9-12)',
    strengths: [
      'Good sentence variety',
      'Clear structure',
      'Appropriate vocabulary'
    ],
    improvements: [
      'Reduce complex sentences',
      'Consider shorter paragraphs', 
      'Minimize passive voice'
    ],
    recommendations: [
      'Aim for 12-18 words per sentence',
      'Use more active voice',
      'Break up longer paragraphs'
    ],
    score: 72,
    wordCount: 245,
    sentenceCount: 16,
    paragraphCount: 4
  }

  const currentAnalysis = analysis || calculatedAnalysis || sampleAnalysis

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  if (isLoading || analyzing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Readability Dashboard</CardTitle>
          <CardDescription className="text-sm">Analyze and improve your writing clarity</CardDescription>
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

  // Don't show stats if there are less than 100 words
  if (currentAnalysis.wordCount < 100) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Keep writing!</p>
        <p className="text-sm text-gray-500">
          Analysis will appear when you have at least 100 words.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Current: {currentAnalysis.wordCount} words
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Readability Dashboard</CardTitle>
        <CardDescription className="text-sm">Analyze and improve your writing clarity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Readability Score</div>
            <div className="text-2xl font-bold" style={{ color: getScoreColor(currentAnalysis.score) }}>
              {currentAnalysis.score}/100
            </div>
            <div className="text-xs text-muted-foreground">Target: 80+ for academic writing</div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Grade Level</div>
            <div className="text-2xl font-bold">
              {currentAnalysis.overallGrade > 12 ? 'Adult' : Math.round(currentAnalysis.overallGrade).toString()}
            </div>
            <div className="text-xs text-muted-foreground">Target: {userGrade}th grade</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Difficulty</div>
            <Badge 
              variant="secondary"
              className="text-xs"
              style={{ 
                backgroundColor: DIFFICULTY_COLORS[currentAnalysis.difficulty] + '20', 
                color: DIFFICULTY_COLORS[currentAnalysis.difficulty] 
              }}
            >
              {currentAnalysis.difficulty}
            </Badge>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Reading Time</div>
            <div className="text-lg font-semibold">{Math.round(currentAnalysis.metrics.readingTimeMinutes)}m</div>
            <div className="text-xs text-muted-foreground">{currentAnalysis.wordCount} words</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Quick Stats</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 p-0"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Words:</span>
              <span className="font-medium">{currentAnalysis.wordCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentences:</span>
              <span className="font-medium">{currentAnalysis.sentenceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paragraphs:</span>
              <span className="font-medium">{currentAnalysis.paragraphCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg/Sentence:</span>
              <span className="font-medium">{currentAnalysis.metrics.averageWordsPerSentence.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="border-t pt-3 space-y-3">
            {/* Top Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Strengths</span>
              </div>
              <ul className="space-y-1">
                {currentAnalysis.strengths.slice(0, 2).map((strength, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="text-green-500 text-sm">•</span>
                    <span className="flex-1">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Improvements */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Areas for Improvement</span>
              </div>
              <ul className="space-y-1">
                {currentAnalysis.improvements.slice(0, 2).map((improvement, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="text-orange-500 text-sm">•</span>
                    <span className="flex-1">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ReadabilityDashboard 