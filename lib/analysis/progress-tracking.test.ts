import {
  WritingSession,
  SessionMetrics,
  ImprovementMetrics,
  MistakePattern,
  ProgressReport,
  PersonalBest,
  SessionTrend,
  WritingGoal,
  createWritingSession,
  calculateSessionMetrics,
  calculateImprovementMetrics,
  trackMistakePatterns,
  generateProgressReport
} from './progress-tracking'
import { EnhancedSuggestion } from '@/lib/types'

// Mock data for testing
const mockSuggestions: EnhancedSuggestion[] = [
  {
    type: 'grammar',
    position: 10,
    originalText: 'are',
    suggestedText: 'is',
    confidence: 0.9,
    explanation: 'Subject-verb agreement error',
    grammarRule: 'subject-verb-agreement',
    learningValue: 'high',
    mistakePattern: 'plural-verb-singular-subject',
    improvementTip: 'Remember to match the verb with the subject',
    educationalFeedback: {
      ruleId: 'subject-verb-agreement',
      ruleName: 'Subject-Verb Agreement',
      category: 'grammar',
      explanation: 'The subject and verb must agree in number',
      examples: [
        { incorrect: 'The cat run', correct: 'The cat runs', explanation: 'Singular subject needs singular verb' },
        { incorrect: 'The cats runs', correct: 'The cats run', explanation: 'Plural subject needs plural verb' }
      ],
      tips: ['Identify the subject first', 'Check if it is singular or plural'],
      difficulty: 'beginner',
      learningObjective: 'Master subject-verb agreement',
      practiceExercise: {
        instruction: 'Complete the sentence with the correct verb form',
        examples: ['The dog ___ (run/runs) in the park', 'The students ___ (study/studies) hard']
      }
    }
  },
  {
    type: 'vocabulary',
    position: 25,
    originalText: 'good',
    suggestedText: 'excellent',
    confidence: 0.8,
    explanation: 'More academic vocabulary',
    grammarRule: 'word-choice',
    learningValue: 'medium',
    mistakePattern: 'informal-language',
    improvementTip: 'Use more precise academic vocabulary',
    educationalFeedback: {
      ruleId: 'word-choice',
      ruleName: 'Academic Word Choice',
      category: 'vocabulary',
      explanation: 'Choose precise academic vocabulary',
      examples: [
        { incorrect: 'good', correct: 'excellent', explanation: 'More precise academic term' },
        { incorrect: 'bad', correct: 'inadequate', explanation: 'More formal academic language' },
        { incorrect: 'big', correct: 'significant', explanation: 'Academic vocabulary for size/importance' }
      ],
      tips: ['Use academic word lists', 'Avoid informal language'],
      difficulty: 'intermediate',
      learningObjective: 'Expand academic vocabulary',
      practiceExercise: {
        instruction: 'Replace informal words with academic alternatives',
        examples: ['Replace "good" with a more academic term', 'Find a formal synonym for "big"']
      }
    }
  },
  {
    type: 'style',
    position: 40,
    originalText: 'I think',
    suggestedText: 'This analysis suggests',
    confidence: 0.85,
    explanation: 'Avoid first person in academic writing',
    grammarRule: 'academic-tone',
    learningValue: 'high',
    mistakePattern: 'first-person-usage',
    improvementTip: 'Use objective language in academic writing',
    educationalFeedback: {
      ruleId: 'academic-tone',
      ruleName: 'Academic Tone',
      category: 'style',
      explanation: 'Maintain objective tone in academic writing',
      examples: [
        { incorrect: 'I think this is important', correct: 'This appears to be significant', explanation: 'Objective language' },
        { incorrect: 'In my opinion', correct: 'The evidence suggests', explanation: 'Evidence-based language' }
      ],
      tips: ['Avoid first person pronouns', 'Use passive voice when appropriate'],
      difficulty: 'intermediate',
      learningObjective: 'Develop academic writing voice',
      practiceExercise: {
        instruction: 'Rewrite sentences to remove first person',
        examples: ['Rewrite: "I believe this theory is correct"', 'Rewrite: "My research shows that..."']
      }
    }
  }
]

const mockText = "The students are working hard on their projects. I think this is a good approach to learning."

describe('Progress Tracking System', () => {
  describe('createWritingSession', () => {
    it('should create a new writing session with correct structure', () => {
      const userId = 'user123'
      const session = createWritingSession(userId, mockText, mockSuggestions)
      
      expect(session.id).toMatch(/^session_user123_\d+$/)
      expect(session.userId).toBe(userId)
      expect(session.text).toBe(mockText)
      expect(session.wordCount).toBe(17)
      expect(session.suggestions).toHaveLength(3)
      expect(session.metrics).toBeDefined()
      expect(session.improvements).toBeDefined()
      expect(session.startTime).toBeInstanceOf(Date)
    })

    it('should include document ID when provided', () => {
      const userId = 'user123'
      const documentId = 'doc456'
      const session = createWritingSession(userId, mockText, mockSuggestions, documentId)
      
      expect(session.documentId).toBe(documentId)
    })
  })

  describe('calculateSessionMetrics', () => {
    it('should calculate basic text metrics correctly', () => {
      const metrics = calculateSessionMetrics(mockText, mockSuggestions)
      
      expect(metrics.wordCount).toBe(17)
      expect(metrics.sentenceCount).toBe(2)
      expect(metrics.paragraphCount).toBe(1)
      expect(metrics.totalSuggestions).toBe(3)
    })

    it('should categorize suggestions by type', () => {
      const metrics = calculateSessionMetrics(mockText, mockSuggestions)
      
      expect(metrics.grammarErrors).toBe(1)
      expect(metrics.vocabularyErrors).toBe(1)
      expect(metrics.styleErrors).toBe(1)
      expect(metrics.academicStyleErrors).toBe(0)
    })

    it('should categorize suggestions by learning value', () => {
      const metrics = calculateSessionMetrics(mockText, mockSuggestions)
      
      expect(metrics.highLearningValueSuggestions).toBe(2)
      expect(metrics.mediumLearningValueSuggestions).toBe(1)
      expect(metrics.lowLearningValueSuggestions).toBe(0)
    })

    it('should calculate readability metrics', () => {
      const metrics = calculateSessionMetrics(mockText, mockSuggestions)
      
      expect(metrics.readabilityScore).toBeGreaterThan(0)
      expect(metrics.readabilityScore).toBeLessThanOrEqual(100)
      expect(metrics.gradeLevel).toBeGreaterThan(0)
      expect(metrics.gradeLevel).toBeLessThanOrEqual(20)
    })

    it('should handle empty text gracefully', () => {
      const metrics = calculateSessionMetrics('', [])
      
      expect(metrics.wordCount).toBe(0)
      expect(metrics.sentenceCount).toBe(0)
      expect(metrics.paragraphCount).toBe(1) // Minimum 1 paragraph
      expect(metrics.totalSuggestions).toBe(0)
    })
  })

  describe('calculateImprovementMetrics', () => {
    it('should return default values for first session', () => {
      const currentMetrics: SessionMetrics = {
        wordCount: 100,
        sentenceCount: 5,
        paragraphCount: 2,
        timeSpent: 10,
        readabilityScore: 70,
        gradeLevel: 12,
        academicVocabularyPercentage: 15,
        totalSuggestions: 5,
        grammarErrors: 2,
        styleErrors: 1,
        vocabularyErrors: 1,
        academicStyleErrors: 1,
        highLearningValueSuggestions: 3,
        mediumLearningValueSuggestions: 1,
        lowLearningValueSuggestions: 1
      }
      
      const improvements = calculateImprovementMetrics('user123', currentMetrics)
      
      expect(improvements.wordCountChange).toBe(0)
      expect(improvements.readabilityImprovement).toBe(0)
      expect(improvements.errorReduction).toBe(0)
      expect(improvements.academicVocabularyImprovement).toBe(0)
      expect(improvements.consistentWritingStreak).toBe(1)
      expect(improvements.improvementStreak).toBe(1)
    })

    it('should calculate improvements compared to previous session', () => {
      const previousSession: WritingSession = {
        id: 'session1',
        userId: 'user123',
        startTime: new Date(Date.now() - 86400000), // 1 day ago
        text: 'Previous text',
        wordCount: 50,
        suggestions: [],
        metrics: {
          wordCount: 50,
          sentenceCount: 3,
          paragraphCount: 1,
          timeSpent: 5,
          readabilityScore: 60,
          gradeLevel: 10,
          academicVocabularyPercentage: 10,
          totalSuggestions: 8,
          grammarErrors: 4,
          styleErrors: 2,
          vocabularyErrors: 1,
          academicStyleErrors: 1,
          highLearningValueSuggestions: 2,
          mediumLearningValueSuggestions: 3,
          lowLearningValueSuggestions: 3
        },
        improvements: {
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

      const currentMetrics: SessionMetrics = {
        wordCount: 100,
        sentenceCount: 5,
        paragraphCount: 2,
        timeSpent: 10,
        readabilityScore: 70,
        gradeLevel: 12,
        academicVocabularyPercentage: 15,
        totalSuggestions: 5,
        grammarErrors: 2,
        styleErrors: 1,
        vocabularyErrors: 1,
        academicStyleErrors: 1,
        highLearningValueSuggestions: 3,
        mediumLearningValueSuggestions: 1,
        lowLearningValueSuggestions: 1
      }
      
      const improvements = calculateImprovementMetrics('user123', currentMetrics, [previousSession])
      
      expect(improvements.wordCountChange).toBe(50) // 100 - 50
      expect(improvements.readabilityImprovement).toBe(10) // 70 - 60
      expect(improvements.errorReduction).toBe(3) // 8 - 5
      expect(improvements.academicVocabularyImprovement).toBe(5) // 15 - 10
    })
  })

  describe('trackMistakePatterns', () => {
    it('should create new mistake patterns from suggestions', () => {
      const patterns = trackMistakePatterns('user123', mockSuggestions, 'session1')
      
      expect(patterns).toHaveLength(3)
      
      const subjectVerbPattern = patterns.find(p => p.ruleId === 'subject-verb-agreement')
      expect(subjectVerbPattern).toBeDefined()
      expect(subjectVerbPattern?.frequency).toBe(1)
      expect(subjectVerbPattern?.improvementTrend).toBe('stable')
      expect(subjectVerbPattern?.mastered).toBe(false)
    })

    it('should update existing mistake patterns', () => {
      const existingPatterns: MistakePattern[] = [
        {
          id: 'pattern1',
          userId: 'user123',
          ruleId: 'subject-verb-agreement',
          ruleName: 'Subject-Verb Agreement',
          category: 'Grammar',
          frequency: 2,
          firstOccurrence: new Date(Date.now() - 86400000),
          lastOccurrence: new Date(Date.now() - 43200000),
          sessions: ['session1', 'session2'],
          improvementTrend: 'stable',
          mastered: false
        }
      ]

      const patterns = trackMistakePatterns('user123', mockSuggestions, 'session3', existingPatterns)
      
      const updatedPattern = patterns.find(p => p.ruleId === 'subject-verb-agreement')
      expect(updatedPattern?.frequency).toBe(3)
      expect(updatedPattern?.sessions).toContain('session3')
    })

    it('should handle suggestions without grammar rules', () => {
      const suggestionsWithoutRules: EnhancedSuggestion[] = [
        {
          type: 'grammar',
          position: 10,
          originalText: 'test',
          suggestedText: 'testing',
          confidence: 0.9,
          explanation: 'Test suggestion',
          learningValue: 'medium',
          mistakePattern: 'test-pattern',
          improvementTip: 'Test tip'
        }
      ]

      const patterns = trackMistakePatterns('user123', suggestionsWithoutRules, 'session1')
      expect(patterns).toHaveLength(0)
    })
  })

  describe('generateProgressReport', () => {
    const mockSessions: WritingSession[] = [
      {
        id: 'session1',
        userId: 'user123',
        startTime: new Date(Date.now() - 86400000 * 3), // 3 days ago (within week)
        text: 'First session text',
        wordCount: 50,
        suggestions: mockSuggestions.slice(0, 2),
        metrics: {
          wordCount: 50,
          sentenceCount: 3,
          paragraphCount: 1,
          timeSpent: 15,
          readabilityScore: 60,
          gradeLevel: 10,
          academicVocabularyPercentage: 10,
          totalSuggestions: 2,
          grammarErrors: 1,
          styleErrors: 1,
          vocabularyErrors: 0,
          academicStyleErrors: 0,
          highLearningValueSuggestions: 1,
          mediumLearningValueSuggestions: 1,
          lowLearningValueSuggestions: 0
        },
        improvements: {
          wordCountChange: 0,
          readabilityImprovement: 0,
          errorReduction: 0,
          academicVocabularyImprovement: 0,
          consistentWritingStreak: 1,
          improvementStreak: 1,
          dailyWordGoalProgress: 0,
          weeklyImprovementGoalProgress: 0
        }
      },
      {
        id: 'session2',
        userId: 'user123',
        startTime: new Date(Date.now() - 86400000), // 1 day ago (within week)
        text: 'Second session text',
        wordCount: 75,
        suggestions: mockSuggestions.slice(0, 1),
        metrics: {
          wordCount: 75,
          sentenceCount: 4,
          paragraphCount: 1,
          timeSpent: 20,
          readabilityScore: 70,
          gradeLevel: 11,
          academicVocabularyPercentage: 15,
          totalSuggestions: 1,
          grammarErrors: 1,
          styleErrors: 0,
          vocabularyErrors: 0,
          academicStyleErrors: 0,
          highLearningValueSuggestions: 1,
          mediumLearningValueSuggestions: 0,
          lowLearningValueSuggestions: 0
        },
        improvements: {
          wordCountChange: 25,
          readabilityImprovement: 10,
          errorReduction: 1,
          academicVocabularyImprovement: 5,
          consistentWritingStreak: 2,
          improvementStreak: 2,
          dailyWordGoalProgress: 0,
          weeklyImprovementGoalProgress: 0
        }
      }
    ]

    const mockMistakePatterns: MistakePattern[] = [
      {
        id: 'pattern1',
        userId: 'user123',
        ruleId: 'subject-verb-agreement',
        ruleName: 'Subject-Verb Agreement',
        category: 'Grammar',
        frequency: 2,
        firstOccurrence: new Date(Date.now() - 604800000),
        lastOccurrence: new Date(Date.now() - 86400000),
        sessions: ['session1', 'session2'],
        improvementTrend: 'improving',
        mastered: false
      }
    ]

    it('should generate comprehensive progress report', () => {
      const report = generateProgressReport('user123', mockSessions, mockMistakePatterns, 'week')
      
      expect(report.userId).toBe('user123')
      expect(report.timeframe).toBe('week')
      expect(report.totalSessions).toBe(2)
      expect(report.totalWordsWritten).toBe(125) // 50 + 75
      expect(report.totalTimeSpent).toBe(35) // 15 + 20
      expect(report.averageReadabilityImprovement).toBe(10) // 70 - 60
      expect(report.errorReductionPercentage).toBe(50) // (2 - 1) / 2 * 100
      expect(report.academicVocabularyGrowth).toBe(5) // 15 - 10
    })

    it('should include session trends', () => {
      const report = generateProgressReport('user123', mockSessions, mockMistakePatterns, 'week')
      
      expect(report.sessionTrends).toHaveLength(2)
      expect(report.sessionTrends[0].wordCount).toBe(50)
      expect(report.sessionTrends[1].wordCount).toBe(75)
    })

    it('should include personal bests', () => {
      const report = generateProgressReport('user123', mockSessions, mockMistakePatterns, 'week')
      
      expect(report.personalBests).toHaveLength(3)
      
      const wordCountBest = report.personalBests.find(b => b.metric === 'Word Count')
      expect(wordCountBest?.value).toBe(75)
      
      const readabilityBest = report.personalBests.find(b => b.metric === 'Readability Score')
      expect(readabilityBest?.value).toBe(70)
      
      const fewestErrorsBest = report.personalBests.find(b => b.metric === 'Fewest Errors')
      expect(fewestErrorsBest?.value).toBe(1)
    })

    it('should include recommendations', () => {
      const report = generateProgressReport('user123', mockSessions, mockMistakePatterns, 'week')
      
      expect(report.recommendations).toBeInstanceOf(Array)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should handle empty sessions gracefully', () => {
      const report = generateProgressReport('user123', [], [], 'week')
      
      expect(report.totalSessions).toBe(0)
      expect(report.totalWordsWritten).toBe(0)
      expect(report.totalTimeSpent).toBe(0)
      expect(report.improvementAreas).toContain('Start writing to track your progress!')
      expect(report.recommendations).toContain('Begin your writing journey to receive personalized recommendations')
    })

    it('should filter sessions by timeframe', () => {
      const oldSession: WritingSession = {
        ...mockSessions[0],
        id: 'oldSession',
        startTime: new Date(Date.now() - 86400000 * 10) // 10 days ago (outside week)
      }
      
      const allSessions = [...mockSessions, oldSession]
      const weekReport = generateProgressReport('user123', allSessions, mockMistakePatterns, 'week')
      
      expect(weekReport.totalSessions).toBe(2) // Should only include sessions from the last week
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed text input', () => {
      const weirdText = "   \n\n\n   \t\t\t   "
      const metrics = calculateSessionMetrics(weirdText, [])
      
      expect(metrics.wordCount).toBe(0)
      expect(metrics.sentenceCount).toBe(0)
      expect(metrics.paragraphCount).toBe(1)
    })

    it('should handle very long text efficiently', () => {
      const longText = 'word '.repeat(10000) // 10,000 words
      const start = Date.now()
      const metrics = calculateSessionMetrics(longText, [])
      const end = Date.now()
      
      expect(metrics.wordCount).toBe(10000)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle sessions with identical timestamps', () => {
      const now = new Date()
      const identicalSessions: WritingSession[] = [
        {
          id: 'session1',
          userId: 'user123',
          startTime: now,
          text: 'Text 1',
          wordCount: 50,
          suggestions: [],
          metrics: {} as SessionMetrics,
          improvements: {} as ImprovementMetrics
        },
        {
          id: 'session2',
          userId: 'user123',
          startTime: now,
          text: 'Text 2',
          wordCount: 60,
          suggestions: [],
          metrics: {} as SessionMetrics,
          improvements: {} as ImprovementMetrics
        }
      ]
      
      const report = generateProgressReport('user123', identicalSessions, [], 'week')
      expect(report.totalSessions).toBe(2)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large numbers of sessions efficiently', () => {
      const largeSessions: WritingSession[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `session${i}`,
        userId: 'user123',
        startTime: new Date(Date.now() - i * 86400000),
        text: `Session ${i} text`,
        wordCount: 50 + i,
        suggestions: [],
        metrics: {
          wordCount: 50 + i,
          sentenceCount: 3,
          paragraphCount: 1,
          timeSpent: 10,
          readabilityScore: 60 + (i % 40),
          gradeLevel: 10,
          academicVocabularyPercentage: 10,
          totalSuggestions: i % 5,
          grammarErrors: i % 3,
          styleErrors: i % 2,
          vocabularyErrors: i % 2,
          academicStyleErrors: i % 1,
          highLearningValueSuggestions: i % 3,
          mediumLearningValueSuggestions: i % 2,
          lowLearningValueSuggestions: i % 1
        },
        improvements: {} as ImprovementMetrics
      }))
      
      const start = Date.now()
      const report = generateProgressReport('user123', largeSessions, [], 'semester')
      const end = Date.now()
      
      expect(report.totalSessions).toBeGreaterThan(0)
      expect(end - start).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle large numbers of mistake patterns efficiently', () => {
      const largeMistakePatterns: MistakePattern[] = Array.from({ length: 100 }, (_, i) => ({
        id: `pattern${i}`,
        userId: 'user123',
        ruleId: `rule${i}`,
        ruleName: `Rule ${i}`,
        category: 'Grammar',
        frequency: i + 1,
        firstOccurrence: new Date(Date.now() - i * 86400000),
        lastOccurrence: new Date(Date.now() - (i * 86400000) / 2),
        sessions: [`session${i}`],
        improvementTrend: i % 3 === 0 ? 'improving' : i % 3 === 1 ? 'stable' : 'worsening',
        mastered: i % 10 === 0
      }))
      
      const start = Date.now()
      const patterns = trackMistakePatterns('user123', mockSuggestions, 'newSession', largeMistakePatterns)
      const end = Date.now()
      
      expect(patterns.length).toBeGreaterThan(100)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })
  })
}) 