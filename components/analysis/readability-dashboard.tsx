'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Target, BookOpen, AlertCircle, CheckCircle, Clock, Award } from 'lucide-react'

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
  onAnalyze?: (text: string) => void
  onRefresh?: () => void
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',
  gray: '#6b7280'
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
  onAnalyze,
  onRefresh
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('flesch')
  const [timeframe, setTimeframe] = useState<string>('week')

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
      'Good sentence variety keeps readers engaged',
      'Appropriate vocabulary level for target audience',
      'Clear paragraph structure'
    ],
    improvements: [
      'Reduce complex sentences for better clarity',
      'Consider shorter paragraphs',
      'Minimize passive voice usage'
    ],
    recommendations: [
      'Aim for 12-18 words per sentence',
      'Use more active voice constructions',
      'Break up longer paragraphs for better readability'
    ],
    score: 72,
    wordCount: 245,
    sentenceCount: 16,
    paragraphCount: 4
  }

  const sampleTrends: ReadabilityTrend[] = [
    { date: '2024-01-01', score: 68, gradeLevel: 9.2, wordCount: 220, difficulty: 'Standard' },
    { date: '2024-01-02', score: 71, gradeLevel: 8.8, wordCount: 235, difficulty: 'Standard' },
    { date: '2024-01-03', score: 69, gradeLevel: 9.0, wordCount: 210, difficulty: 'Standard' },
    { date: '2024-01-04', score: 74, gradeLevel: 8.5, wordCount: 245, difficulty: 'Fairly Easy' },
    { date: '2024-01-05', score: 72, gradeLevel: 8.7, wordCount: 238, difficulty: 'Standard' },
    { date: '2024-01-06', score: 76, gradeLevel: 8.2, wordCount: 252, difficulty: 'Fairly Easy' },
    { date: '2024-01-07', score: 73, gradeLevel: 8.6, wordCount: 241, difficulty: 'Standard' }
  ]

  const currentAnalysis = analysis || sampleAnalysis
  const currentTrends = trends.length > 0 ? trends : sampleTrends

  // Prepare data for charts
  const metricsData = [
    { name: 'Flesch Score', value: currentAnalysis.metrics.fleschScore, target: 60, color: COLORS.primary },
    { name: 'Grade Level', value: currentAnalysis.metrics.fleschKincaidGrade, target: targetGradeLevel, color: COLORS.info },
    { name: 'Words/Sentence', value: currentAnalysis.metrics.averageWordsPerSentence, target: 15, color: COLORS.success },
    { name: 'Complex Words %', value: currentAnalysis.metrics.complexWordsPercentage, target: 10, color: COLORS.warning },
    { name: 'Passive Voice %', value: currentAnalysis.metrics.passiveVoicePercentage, target: 5, color: COLORS.danger }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success
    if (score >= 60) return COLORS.info
    if (score >= 40) return COLORS.warning
    return COLORS.danger
  }

  const getGradeTrend = () => {
    if (currentTrends.length < 2) return null
    const recent = currentTrends[currentTrends.length - 1].gradeLevel
    const previous = currentTrends[currentTrends.length - 2].gradeLevel
    return recent - previous
  }

  const gradeTrend = getGradeTrend()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Readability Dashboard</h2>
          <p className="text-muted-foreground">Analyze and improve your writing clarity</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {onAnalyze && (
            <Button onClick={() => onAnalyze('')}>
              Analyze Text
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readability Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: getScoreColor(currentAnalysis.score) }}>
              {currentAnalysis.score}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 80+ for academic writing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {currentAnalysis.overallGrade.toFixed(1)}
              {gradeTrend !== null && (
                gradeTrend > 0 ? 
                  <TrendingUp className="h-4 w-4 text-red-500" /> :
                  <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {targetGradeLevel}th grade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: DIFFICULTY_COLORS[currentAnalysis.difficulty] + '20', color: DIFFICULTY_COLORS[currentAnalysis.difficulty] }}
              >
                {currentAnalysis.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAnalysis.targetAudience}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentAnalysis.metrics.readingTimeMinutes.toFixed(1)}m
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAnalysis.wordCount} words
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Readability Score</CardTitle>
                <CardDescription>Current performance vs. target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48">
                  <div className="relative">
                    <div 
                      className="w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: getScoreColor(currentAnalysis.score) }}
                    >
                      {currentAnalysis.score}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
                      out of 100
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics vs. Targets</CardTitle>
                <CardDescription>How your writing measures up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metricsData.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.name}</span>
                        <span>{metric.value.toFixed(1)} / {metric.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                            backgroundColor: metric.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Text Analysis Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentAnalysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Words:</span>
                  <span className="text-sm font-medium">{currentAnalysis.wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sentences:</span>
                  <span className="text-sm font-medium">{currentAnalysis.sentenceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paragraphs:</span>
                  <span className="text-sm font-medium">{currentAnalysis.paragraphCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Words/Sentence:</span>
                  <span className="text-sm font-medium">{currentAnalysis.metrics.averageWordsPerSentence.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Readability Metrics</CardTitle>
              <CardDescription>Comprehensive analysis of your text</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flesch Reading Ease</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.fleschScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Higher scores = easier to read</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flesch-Kincaid Grade</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.fleschKincaidGrade.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">US grade level required</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coleman-Liau Index</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.colemanLiauIndex.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Based on character count</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gunning Fog Index</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.gunningFogIndex.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Years of education needed</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMOG Index</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.smogIndex.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Simple Measure of Gobbledygook</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">ARI Score</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.automatedReadabilityIndex.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Automated Readability Index</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Writing Style Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complex Words</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.complexWordsPercentage.toFixed(1)}%</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passive Voice</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.passiveVoicePercentage.toFixed(1)}%</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sentence Variety</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.sentenceVariety.toFixed(1)}</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Syllables/Word</label>
                  <div className="text-2xl font-bold">{currentAnalysis.metrics.averageSyllablesPerWord.toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readability Trends</CardTitle>
              <CardDescription>Track your progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Trend visualization would appear here with chart libraries
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTrends.slice(-4).map((trend, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{trend.date}</span>
                        <Badge variant="outline">{trend.difficulty}</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Score:</span>
                          <span className="font-medium">{trend.score}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Grade Level:</span>
                          <span className="font-medium">{trend.gradeLevel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Words:</span>
                          <span className="font-medium">{trend.wordCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>Specific suggestions to improve your writing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReadabilityDashboard 