// Progress tracking system for writing improvement and mistake patterns
// Tracks student writing progress over time with detailed analytics

import { Suggestion, EnhancedSuggestion } from '@/lib/types'
import { countWords, extractWords } from "@/lib/utils"

export interface WritingSession {
  id: string
  userId: string
  documentId?: string
  startTime: Date
  endTime?: Date
  text: string
  wordCount: number
  suggestions: EnhancedSuggestion[]
  metrics: SessionMetrics
  improvements: ImprovementMetrics
}

export interface SessionMetrics {
  // Basic metrics
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  timeSpent: number // minutes
  
  // Quality metrics
  readabilityScore: number
  gradeLevel: number
  academicVocabularyPercentage: number
  
  // Error metrics
  totalSuggestions: number
  grammarErrors: number
  styleErrors: number
  vocabularyErrors: number
  academicStyleErrors: number
  
  // Learning metrics
  highLearningValueSuggestions: number
  mediumLearningValueSuggestions: number
  lowLearningValueSuggestions: number
}

export interface ImprovementMetrics {
  // Improvement over previous sessions
  wordCountChange: number
  readabilityImprovement: number
  errorReduction: number
  academicVocabularyImprovement: number
  
  // Streak tracking
  consistentWritingStreak: number
  improvementStreak: number
  
  // Goal progress
  dailyWordGoalProgress: number
  weeklyImprovementGoalProgress: number
}

export interface MistakePattern {
  id: string
  userId: string
  ruleId: string
  ruleName: string
  category: string
  frequency: number
  firstOccurrence: Date
  lastOccurrence: Date
  sessions: string[] // session IDs where this mistake occurred
  improvementTrend: 'improving' | 'stable' | 'worsening'
  mastered: boolean
}

export interface ProgressReport {
  userId: string
  timeframe: 'week' | 'month' | 'semester'
  startDate: Date
  endDate: Date
  
  // Overall progress
  totalSessions: number
  totalWordsWritten: number
  totalTimeSpent: number
  
  // Improvement metrics
  averageReadabilityImprovement: number
  errorReductionPercentage: number
  academicVocabularyGrowth: number
  
  // Strengths and areas for improvement
  strengths: string[]
  improvementAreas: string[]
  masteredConcepts: string[]
  strugglingConcepts: string[]
  
  // Goals and achievements
  goalsAchieved: string[]
  currentStreak: number
  personalBests: PersonalBest[]
  
  // Detailed analytics
  sessionTrends: SessionTrend[]
  mistakePatterns: MistakePattern[]
  recommendations: string[]
}

export interface PersonalBest {
  metric: string
  value: number
  achievedDate: Date
  sessionId: string
}

export interface SessionTrend {
  date: Date
  wordCount: number
  readabilityScore: number
  errorCount: number
  timeSpent: number
}

export interface WritingGoal {
  id: string
  userId: string
  type: 'daily_words' | 'weekly_improvement' | 'error_reduction' | 'academic_vocabulary'
  target: number
  current: number
  deadline: Date
  achieved: boolean
  createdAt: Date
}

/**
 * Create a new writing session
 */
export function createWritingSession(
  userId: string,
  text: string,
  suggestions: EnhancedSuggestion[],
  documentId?: string
): WritingSession {
  const now = new Date()
  const sessionId = `session_${userId}_${now.getTime()}`
  
  const metrics = calculateSessionMetrics(text, suggestions)
  const improvements = calculateImprovementMetrics(userId, metrics)
  
  return {
    id: sessionId,
    userId,
    documentId,
    startTime: now,
    text,
    wordCount: metrics.wordCount,
    suggestions,
    metrics,
    improvements
  }
}

/**
 * Calculate metrics for a writing session
 */
export function calculateSessionMetrics(
  text: string,
  suggestions: EnhancedSuggestion[]
): SessionMetrics {
  // Basic text metrics
  const words = extractWords(text) // Use standardized word extraction
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  
  // Error categorization
  const grammarErrors = suggestions.filter(s => s.type === 'grammar').length
  const styleErrors = suggestions.filter(s => s.type === 'style').length
  const vocabularyErrors = suggestions.filter(s => s.type === 'vocabulary').length
  const academicStyleErrors = suggestions.filter(s => s.type === 'academic-style').length
  
  // Learning value distribution
  const highLearningValue = suggestions.filter(s => s.learningValue === 'high').length
  const mediumLearningValue = suggestions.filter(s => s.learningValue === 'medium').length
  const lowLearningValue = suggestions.filter(s => s.learningValue === 'low').length
  
  // Calculate academic vocabulary percentage (simplified)
  const academicWords = ['analyze', 'demonstrate', 'evaluate', 'significant', 'evidence', 'hypothesis', 'methodology', 'conclusion']
  const academicWordCount = words.filter(word => 
    academicWords.includes(word.toLowerCase())
  ).length
  const academicVocabularyPercentage = words.length > 0 ? (academicWordCount / words.length) * 100 : 0
  
  // Simplified readability calculation
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * 1.5))) // Simplified Flesch
  const gradeLevel = Math.max(1, Math.min(20, (0.39 * avgWordsPerSentence) + (11.8 * 1.5) - 15.59)) // Simplified Flesch-Kincaid
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: Math.max(1, paragraphs.length),
    timeSpent: 0, // Will be calculated when session ends
    readabilityScore,
    gradeLevel,
    academicVocabularyPercentage,
    totalSuggestions: suggestions.length,
    grammarErrors,
    styleErrors,
    vocabularyErrors,
    academicStyleErrors,
    highLearningValueSuggestions: highLearningValue,
    mediumLearningValueSuggestions: mediumLearningValue,
    lowLearningValueSuggestions: lowLearningValue
  }
}

/**
 * Calculate improvement metrics compared to previous sessions
 */
export function calculateImprovementMetrics(
  userId: string,
  currentMetrics: SessionMetrics,
  previousSessions: WritingSession[] = []
): ImprovementMetrics {
  if (previousSessions.length === 0) {
    return {
      wordCountChange: 0,
      readabilityImprovement: 0,
      errorReduction: 0,
      academicVocabularyImprovement: 0,
      consistentWritingStreak: 1,
      improvementStreak: 1,
      dailyWordGoalProgress: 0,
      weeklyImprovementGoalProgress: 0
    }
  }
  
  // Get the most recent session for comparison
  const lastSession = previousSessions[previousSessions.length - 1]
  const lastMetrics = lastSession.metrics
  
  // Calculate improvements
  const wordCountChange = currentMetrics.wordCount - lastMetrics.wordCount
  const readabilityImprovement = currentMetrics.readabilityScore - lastMetrics.readabilityScore
  const errorReduction = lastMetrics.totalSuggestions - currentMetrics.totalSuggestions
  const academicVocabularyImprovement = currentMetrics.academicVocabularyPercentage - lastMetrics.academicVocabularyPercentage
  
  // Calculate streaks
  const consistentWritingStreak = calculateConsistentWritingStreak(previousSessions)
  const improvementStreak = calculateImprovementStreak(previousSessions, currentMetrics)
  
  return {
    wordCountChange,
    readabilityImprovement,
    errorReduction,
    academicVocabularyImprovement,
    consistentWritingStreak,
    improvementStreak,
    dailyWordGoalProgress: 0, // Would be calculated based on daily goals
    weeklyImprovementGoalProgress: 0 // Would be calculated based on weekly goals
  }
}

/**
 * Track mistake patterns across sessions
 */
export function trackMistakePatterns(
  userId: string,
  suggestions: EnhancedSuggestion[],
  sessionId: string,
  existingPatterns: MistakePattern[] = []
): MistakePattern[] {
  const patterns = new Map<string, MistakePattern>()
  
  // Initialize with existing patterns
  existingPatterns.forEach(pattern => {
    patterns.set(pattern.ruleId, { ...pattern })
  })
  
  // Process suggestions to update patterns
  suggestions.forEach(suggestion => {
    if (!suggestion.grammarRule) return
    
    const ruleId = suggestion.grammarRule
    const existing = patterns.get(ruleId)
    
    if (existing) {
      // Update existing pattern
      existing.frequency += 1
      existing.lastOccurrence = new Date()
      existing.sessions.push(sessionId)
      
      // Update improvement trend (simplified)
      const recentSessions = existing.sessions.slice(-5) // Last 5 sessions
      const oldSessions = existing.sessions.slice(-10, -5) // Previous 5 sessions
      
      if (recentSessions.length >= 3 && oldSessions.length >= 3) {
        const recentFreq = recentSessions.length
        const oldFreq = oldSessions.length
        
        if (recentFreq < oldFreq * 0.7) {
          existing.improvementTrend = 'improving'
        } else if (recentFreq > oldFreq * 1.3) {
          existing.improvementTrend = 'worsening'
        } else {
          existing.improvementTrend = 'stable'
        }
      }
      
      // Check if mastered (no occurrences in last 5 sessions with improving trend)
      existing.mastered = existing.improvementTrend === 'improving' && 
                         existing.sessions.slice(-5).length === 0
    } else {
      // Create new pattern
      const newPattern: MistakePattern = {
        id: `pattern_${userId}_${ruleId}_${Date.now()}`,
        userId,
        ruleId,
        ruleName: suggestion.educationalFeedback?.ruleName || ruleId,
        category: suggestion.educationalFeedback?.category || suggestion.type,
        frequency: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        sessions: [sessionId],
        improvementTrend: 'stable',
        mastered: false
      }
      patterns.set(ruleId, newPattern)
    }
  })
  
  return Array.from(patterns.values())
}

/**
 * Generate comprehensive progress report
 */
export function generateProgressReport(
  userId: string,
  sessions: WritingSession[],
  mistakePatterns: MistakePattern[],
  timeframe: 'week' | 'month' | 'semester' = 'week'
): ProgressReport {
  if (sessions.length === 0) {
    return createEmptyProgressReport(userId, timeframe)
  }
  
  // Filter sessions by timeframe
  const now = new Date()
  const startDate = getTimeframeStartDate(now, timeframe)
  const filteredSessions = sessions.filter(s => s.startTime >= startDate)
  
  // Calculate overall metrics
  const totalSessions = filteredSessions.length
  const totalWordsWritten = filteredSessions.reduce((sum, s) => sum + s.wordCount, 0)
  const totalTimeSpent = filteredSessions.reduce((sum, s) => sum + s.metrics.timeSpent, 0)
  
  // Calculate improvements
  const firstSession = filteredSessions[0]
  const lastSession = filteredSessions[filteredSessions.length - 1]
  
  const averageReadabilityImprovement = lastSession && firstSession ? 
    lastSession.metrics.readabilityScore - firstSession.metrics.readabilityScore : 0
  
  const errorReductionPercentage = lastSession && firstSession && firstSession.metrics.totalSuggestions > 0 ? 
    ((firstSession.metrics.totalSuggestions - lastSession.metrics.totalSuggestions) / firstSession.metrics.totalSuggestions) * 100 : 0
  
  const academicVocabularyGrowth = lastSession && firstSession ? 
    lastSession.metrics.academicVocabularyPercentage - firstSession.metrics.academicVocabularyPercentage : 0
  
  // Identify strengths and areas for improvement
  const { strengths, improvementAreas } = analyzeStrengthsAndWeaknesses(filteredSessions, mistakePatterns)
  
  // Identify mastered and struggling concepts
  const masteredConcepts = mistakePatterns.filter(p => p.mastered).map(p => p.ruleName)
  const strugglingConcepts = mistakePatterns
    .filter(p => p.improvementTrend === 'worsening' && p.frequency > 3)
    .map(p => p.ruleName)
  
  // Calculate personal bests
  const personalBests = calculatePersonalBests(filteredSessions)
  
  // Generate session trends
  const sessionTrends = generateSessionTrends(filteredSessions)
  
  // Generate recommendations
  const recommendations = generateRecommendations(filteredSessions, mistakePatterns)
  
  return {
    userId,
    timeframe,
    startDate,
    endDate: now,
    totalSessions,
    totalWordsWritten,
    totalTimeSpent,
    averageReadabilityImprovement,
    errorReductionPercentage,
    academicVocabularyGrowth,
    strengths,
    improvementAreas,
    masteredConcepts,
    strugglingConcepts,
    goalsAchieved: [], // Would be calculated based on user goals
    currentStreak: calculateConsistentWritingStreak(filteredSessions),
    personalBests,
    sessionTrends,
    mistakePatterns: mistakePatterns.filter(p => p.sessions.some(sessionId => 
      filteredSessions.some(s => s.id === sessionId)
    )),
    recommendations
  }
}

/**
 * Helper functions
 */

function calculateConsistentWritingStreak(sessions: WritingSession[]): number {
  if (sessions.length === 0) return 0
  
  const sortedSessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  let streak = 1
  
  for (let i = sortedSessions.length - 1; i > 0; i--) {
    const current = sortedSessions[i].startTime
    const previous = sortedSessions[i - 1].startTime
    const daysDiff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff <= 2) { // Allow for weekends
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function calculateImprovementStreak(sessions: WritingSession[], currentMetrics: SessionMetrics): number {
  if (sessions.length === 0) return 1
  
  let streak = 1
  let lastScore = currentMetrics.readabilityScore
  
  for (let i = sessions.length - 1; i >= 0; i--) {
    const sessionScore = sessions[i].metrics.readabilityScore
    if (sessionScore < lastScore) {
      streak++
      lastScore = sessionScore
    } else {
      break
    }
  }
  
  return streak
}

function getTimeframeStartDate(endDate: Date, timeframe: 'week' | 'month' | 'semester'): Date {
  const start = new Date(endDate)
  
  switch (timeframe) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'semester':
      start.setMonth(start.getMonth() - 4)
      break
  }
  
  return start
}

function createEmptyProgressReport(userId: string, timeframe: 'week' | 'month' | 'semester'): ProgressReport {
  const now = new Date()
  return {
    userId,
    timeframe,
    startDate: getTimeframeStartDate(now, timeframe),
    endDate: now,
    totalSessions: 0,
    totalWordsWritten: 0,
    totalTimeSpent: 0,
    averageReadabilityImprovement: 0,
    errorReductionPercentage: 0,
    academicVocabularyGrowth: 0,
    strengths: [],
    improvementAreas: ['Start writing to track your progress!'],
    masteredConcepts: [],
    strugglingConcepts: [],
    goalsAchieved: [],
    currentStreak: 0,
    personalBests: [],
    sessionTrends: [],
    mistakePatterns: [],
    recommendations: ['Begin your writing journey to receive personalized recommendations']
  }
}

function analyzeStrengthsAndWeaknesses(
  sessions: WritingSession[], 
  mistakePatterns: MistakePattern[]
): { strengths: string[]; improvementAreas: string[] } {
  const strengths: string[] = []
  const improvementAreas: string[] = []
  
  if (sessions.length === 0) {
    return { strengths, improvementAreas }
  }
  
  const avgMetrics = calculateAverageMetrics(sessions)
  
  // Analyze strengths
  if (avgMetrics.readabilityScore > 70) {
    strengths.push('Strong readability and clarity in writing')
  }
  if (avgMetrics.academicVocabularyPercentage > 15) {
    strengths.push('Good use of academic vocabulary')
  }
  if (avgMetrics.grammarErrors / avgMetrics.totalSuggestions < 0.3) {
    strengths.push('Solid grammar foundation')
  }
  
  // Analyze improvement areas
  if (avgMetrics.readabilityScore < 50) {
    improvementAreas.push('Focus on improving sentence clarity and readability')
  }
  if (avgMetrics.academicVocabularyPercentage < 10) {
    improvementAreas.push('Incorporate more academic vocabulary')
  }
  if (avgMetrics.grammarErrors / avgMetrics.totalSuggestions > 0.5) {
    improvementAreas.push('Review fundamental grammar rules')
  }
  
  // Analyze mistake patterns
  const frequentMistakes = mistakePatterns
    .filter(p => p.frequency > 3 && p.improvementTrend !== 'improving')
    .slice(0, 3)
  
  frequentMistakes.forEach(mistake => {
    improvementAreas.push(`Work on ${mistake.ruleName.toLowerCase()}`)
  })
  
  return { strengths, improvementAreas }
}

function calculateAverageMetrics(sessions: WritingSession[]): SessionMetrics {
  if (sessions.length === 0) {
    return {
      wordCount: 0, sentenceCount: 0, paragraphCount: 0, timeSpent: 0,
      readabilityScore: 0, gradeLevel: 0, academicVocabularyPercentage: 0,
      totalSuggestions: 0, grammarErrors: 0, styleErrors: 0, vocabularyErrors: 0,
      academicStyleErrors: 0, highLearningValueSuggestions: 0,
      mediumLearningValueSuggestions: 0, lowLearningValueSuggestions: 0
    }
  }
  
  const totals = sessions.reduce((acc, session) => {
    const m = session.metrics
    return {
      wordCount: acc.wordCount + m.wordCount,
      sentenceCount: acc.sentenceCount + m.sentenceCount,
      paragraphCount: acc.paragraphCount + m.paragraphCount,
      timeSpent: acc.timeSpent + m.timeSpent,
      readabilityScore: acc.readabilityScore + m.readabilityScore,
      gradeLevel: acc.gradeLevel + m.gradeLevel,
      academicVocabularyPercentage: acc.academicVocabularyPercentage + m.academicVocabularyPercentage,
      totalSuggestions: acc.totalSuggestions + m.totalSuggestions,
      grammarErrors: acc.grammarErrors + m.grammarErrors,
      styleErrors: acc.styleErrors + m.styleErrors,
      vocabularyErrors: acc.vocabularyErrors + m.vocabularyErrors,
      academicStyleErrors: acc.academicStyleErrors + m.academicStyleErrors,
      highLearningValueSuggestions: acc.highLearningValueSuggestions + m.highLearningValueSuggestions,
      mediumLearningValueSuggestions: acc.mediumLearningValueSuggestions + m.mediumLearningValueSuggestions,
      lowLearningValueSuggestions: acc.lowLearningValueSuggestions + m.lowLearningValueSuggestions
    }
  }, {
    wordCount: 0, sentenceCount: 0, paragraphCount: 0, timeSpent: 0,
    readabilityScore: 0, gradeLevel: 0, academicVocabularyPercentage: 0,
    totalSuggestions: 0, grammarErrors: 0, styleErrors: 0, vocabularyErrors: 0,
    academicStyleErrors: 0, highLearningValueSuggestions: 0,
    mediumLearningValueSuggestions: 0, lowLearningValueSuggestions: 0
  })
  
  const count = sessions.length
  return {
    wordCount: Math.round(totals.wordCount / count),
    sentenceCount: Math.round(totals.sentenceCount / count),
    paragraphCount: Math.round(totals.paragraphCount / count),
    timeSpent: Math.round(totals.timeSpent / count),
    readabilityScore: Math.round(totals.readabilityScore / count),
    gradeLevel: Math.round(totals.gradeLevel / count),
    academicVocabularyPercentage: Math.round(totals.academicVocabularyPercentage / count),
    totalSuggestions: Math.round(totals.totalSuggestions / count),
    grammarErrors: Math.round(totals.grammarErrors / count),
    styleErrors: Math.round(totals.styleErrors / count),
    vocabularyErrors: Math.round(totals.vocabularyErrors / count),
    academicStyleErrors: Math.round(totals.academicStyleErrors / count),
    highLearningValueSuggestions: Math.round(totals.highLearningValueSuggestions / count),
    mediumLearningValueSuggestions: Math.round(totals.mediumLearningValueSuggestions / count),
    lowLearningValueSuggestions: Math.round(totals.lowLearningValueSuggestions / count)
  }
}

function calculatePersonalBests(sessions: WritingSession[]): PersonalBest[] {
  if (sessions.length === 0) return []
  
  const bests: PersonalBest[] = []
  
  // Find best word count
  const bestWordCount = sessions.reduce((best, session) => 
    session.wordCount > best.wordCount ? session : best
  )
  bests.push({
    metric: 'Word Count',
    value: bestWordCount.wordCount,
    achievedDate: bestWordCount.startTime,
    sessionId: bestWordCount.id
  })
  
  // Find best readability score
  const bestReadability = sessions.reduce((best, session) => 
    session.metrics.readabilityScore > best.metrics.readabilityScore ? session : best
  )
  bests.push({
    metric: 'Readability Score',
    value: Math.round(bestReadability.metrics.readabilityScore),
    achievedDate: bestReadability.startTime,
    sessionId: bestReadability.id
  })
  
  // Find fewest errors
  const fewestErrors = sessions.reduce((best, session) => 
    session.metrics.totalSuggestions < best.metrics.totalSuggestions ? session : best
  )
  bests.push({
    metric: 'Fewest Errors',
    value: fewestErrors.metrics.totalSuggestions,
    achievedDate: fewestErrors.startTime,
    sessionId: fewestErrors.id
  })
  
  return bests
}

function generateSessionTrends(sessions: WritingSession[]): SessionTrend[] {
  return sessions.map(session => ({
    date: session.startTime,
    wordCount: session.wordCount,
    readabilityScore: session.metrics.readabilityScore,
    errorCount: session.metrics.totalSuggestions,
    timeSpent: session.metrics.timeSpent
  })).sort((a, b) => a.date.getTime() - b.date.getTime())
}

function generateRecommendations(
  sessions: WritingSession[], 
  mistakePatterns: MistakePattern[]
): string[] {
  const recommendations: string[] = []
  
  if (sessions.length === 0) {
    return ['Start writing to receive personalized recommendations']
  }
  
  const recentSessions = sessions.slice(-5)
  const avgMetrics = calculateAverageMetrics(recentSessions)
  
  // Grammar recommendations
  if (avgMetrics.grammarErrors > 3) {
    recommendations.push('Review basic grammar rules and practice with grammar exercises')
  }
  
  // Vocabulary recommendations
  if (avgMetrics.academicVocabularyPercentage < 10) {
    recommendations.push('Read academic articles to expand your vocabulary')
  }
  
  // Readability recommendations
  if (avgMetrics.readabilityScore < 50) {
    recommendations.push('Focus on writing shorter, clearer sentences')
  }
  
  // Pattern-based recommendations
  const worseningPatterns = mistakePatterns.filter(p => p.improvementTrend === 'worsening')
  if (worseningPatterns.length > 0) {
    const topPattern = worseningPatterns.sort((a, b) => b.frequency - a.frequency)[0]
    recommendations.push(`Focus on improving ${topPattern.ruleName.toLowerCase()} - this area needs attention`)
  }
  
  // Consistency recommendations
  const streak = calculateConsistentWritingStreak(sessions)
  if (streak < 3) {
    recommendations.push('Try to write consistently every day to build good habits')
  }
  
  // Positive reinforcement
  const improvingPatterns = mistakePatterns.filter(p => p.improvementTrend === 'improving')
  if (improvingPatterns.length > 0) {
    recommendations.push(`Great progress on ${improvingPatterns[0].ruleName.toLowerCase()}! Keep up the good work`)
  }
  
  return recommendations.slice(0, 5) // Limit to top 5 recommendations
} 