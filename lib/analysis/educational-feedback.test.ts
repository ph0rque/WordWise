import {
  getGrammarRule,
  getGrammarRulesByCategory,
  getGrammarRulesByDifficulty,
  identifyMistakePatterns,
  createEducationalFeedback,
  enhanceSuggestionsWithEducation,
  generateEducationalReport,
  getAllGrammarRules,
  searchGrammarRules
} from './educational-feedback'
import { Suggestion } from '@/lib/types'

describe('Educational Feedback System', () => {
  describe('getGrammarRule', () => {
    it('should return a grammar rule by ID', () => {
      const rule = getGrammarRule('subject-verb-agreement')
      
      expect(rule).toBeDefined()
      expect(rule?.id).toBe('subject-verb-agreement')
      expect(rule?.name).toBe('Subject-Verb Agreement')
      expect(rule?.category).toBe('grammar')
      expect(rule?.difficulty).toBe('beginner')
    })

    it('should return null for non-existent rule', () => {
      const rule = getGrammarRule('non-existent-rule')
      expect(rule).toBeNull()
    })
  })

  describe('getGrammarRulesByCategory', () => {
    it('should return rules for grammar category', () => {
      const grammarRules = getGrammarRulesByCategory('grammar')
      
      expect(grammarRules.length).toBeGreaterThan(0)
      expect(grammarRules.every(rule => rule.category === 'grammar')).toBe(true)
      expect(grammarRules.some(rule => rule.id === 'subject-verb-agreement')).toBe(true)
    })

    it('should return rules for academic-style category', () => {
      const styleRules = getGrammarRulesByCategory('academic-style')
      
      expect(styleRules.length).toBeGreaterThan(0)
      expect(styleRules.every(rule => rule.category === 'academic-style')).toBe(true)
      expect(styleRules.some(rule => rule.id === 'academic-tone')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const rules = getGrammarRulesByCategory('non-existent' as any)
      expect(rules).toEqual([])
    })
  })

  describe('getGrammarRulesByDifficulty', () => {
    it('should return beginner rules', () => {
      const beginnerRules = getGrammarRulesByDifficulty('beginner')
      
      expect(beginnerRules.length).toBeGreaterThan(0)
      expect(beginnerRules.every(rule => rule.difficulty === 'beginner')).toBe(true)
    })

    it('should return intermediate rules', () => {
      const intermediateRules = getGrammarRulesByDifficulty('intermediate')
      
      expect(intermediateRules.length).toBeGreaterThan(0)
      expect(intermediateRules.every(rule => rule.difficulty === 'intermediate')).toBe(true)
    })

    it('should return advanced rules', () => {
      const advancedRules = getGrammarRulesByDifficulty('advanced')
      
      expect(advancedRules.length).toBeGreaterThan(0)
      expect(advancedRules.every(rule => rule.difficulty === 'advanced')).toBe(true)
    })
  })

  describe('identifyMistakePatterns', () => {
    it('should identify informal language patterns', () => {
      const text = 'This is really good stuff that shows big things.'
      const mistakes = identifyMistakePatterns(text)
      
      expect(mistakes.length).toBeGreaterThan(0)
      expect(mistakes.some(m => m.pattern === 'really')).toBe(true)
      expect(mistakes.some(m => m.pattern === 'good')).toBe(true)
      expect(mistakes.some(m => m.pattern === 'stuff')).toBe(true)
      expect(mistakes.some(m => m.pattern === 'big')).toBe(true)
    })

    it('should identify first-person patterns', () => {
      const text = 'I think this research is important. In my opinion, the results are significant.'
      const mistakes = identifyMistakePatterns(text)
      
      expect(mistakes.some(m => m.pattern === 'I think')).toBe(true)
      expect(mistakes.some(m => m.pattern === 'in my opinion')).toBe(true)
    })

    it('should identify contractions', () => {
      const text = "The results don't show what we expected. It's important to note this."
      const mistakes = identifyMistakePatterns(text)
      
      expect(mistakes.some(m => m.pattern === "don't")).toBe(true)
      expect(mistakes.some(m => m.pattern === "it's")).toBe(true)
    })

    it('should provide position information', () => {
      const text = 'This is really important.'
      const mistakes = identifyMistakePatterns(text)
      
      const reallyMistake = mistakes.find(m => m.pattern === 'really')
      expect(reallyMistake).toBeDefined()
      expect(reallyMistake?.positions).toHaveLength(1)
      expect(reallyMistake?.positions[0].start).toBe(8)
      expect(reallyMistake?.positions[0].end).toBe(14)
    })

    it('should return empty array for clean text', () => {
      const text = 'This research demonstrates significant findings through comprehensive analysis.'
      const mistakes = identifyMistakePatterns(text)
      
      expect(mistakes).toEqual([])
    })
  })

  describe('createEducationalFeedback', () => {
    it('should create feedback for subject-verb agreement', () => {
      const feedback = createEducationalFeedback('subject-verb-agreement', 'The student are studying hard.')
      
      expect(feedback).toBeDefined()
      expect(feedback?.ruleId).toBe('subject-verb-agreement')
      expect(feedback?.ruleName).toBe('Subject-Verb Agreement')
      expect(feedback?.category).toBe('grammar')
      expect(feedback?.difficulty).toBe('beginner')
      expect(feedback?.examples.length).toBeGreaterThan(0)
      expect(feedback?.tips.length).toBeGreaterThan(0)
      expect(feedback?.learningObjective).toContain('subjects and verbs')
    })

    it('should create feedback for academic tone', () => {
      const feedback = createEducationalFeedback('academic-tone', 'I think this research is really important.')
      
      expect(feedback).toBeDefined()
      expect(feedback?.ruleId).toBe('academic-tone')
      expect(feedback?.category).toBe('academic-style')
      expect(feedback?.difficulty).toBe('intermediate')
      expect(feedback?.practiceExercise).toBeDefined()
    })

    it('should return null for non-existent rule', () => {
      const feedback = createEducationalFeedback('non-existent-rule', 'Some text.')
      expect(feedback).toBeNull()
    })

    it('should include practice exercises for supported rules', () => {
      const feedback = createEducationalFeedback('word-choice', 'The study looked at things.')
      
      expect(feedback?.practiceExercise).toBeDefined()
      expect(feedback?.practiceExercise?.instruction).toBeDefined()
      expect(feedback?.practiceExercise?.examples).toBeDefined()
      expect(feedback?.practiceExercise?.examples.length).toBeGreaterThan(0)
    })
  })

  describe('enhanceSuggestionsWithEducation', () => {
    it('should enhance suggestions with educational feedback', () => {
      const suggestions: Suggestion[] = [
        {
          type: 'academic-style',
          position: 8,
          originalText: 'really',
          suggestedText: 'significantly',
          explanation: 'Use more formal language'
        },
        {
          type: 'vocabulary',
          position: 15,
          originalText: 'good',
          suggestedText: 'effective',
          explanation: 'Use more precise vocabulary'
        }
      ]
      
      const text = 'This is really good research.'
      const enhanced = enhanceSuggestionsWithEducation(suggestions, text)
      
      expect(enhanced).toHaveLength(2)
      expect(enhanced[0].learningValue).toBe('high')
      expect(enhanced[0].improvementTip).toBeDefined()
      expect(enhanced[1].learningValue).toBe('medium')
    })

    it('should assign learning values based on suggestion type', () => {
      const suggestions: Suggestion[] = [
        {
          type: 'grammar',
          position: 0,
          originalText: 'test',
          suggestedText: 'test',
          explanation: 'Grammar error'
        },
        {
          type: 'spelling',
          position: 0,
          originalText: 'test',
          suggestedText: 'test',
          explanation: 'Spelling error'
        },
        {
          type: 'style',
          position: 0,
          originalText: 'test',
          suggestedText: 'test',
          explanation: 'Style improvement'
        }
      ]
      
      const enhanced = enhanceSuggestionsWithEducation(suggestions, 'test text')
      
      expect(enhanced[0].learningValue).toBe('high') // grammar
      expect(enhanced[1].learningValue).toBe('low')  // spelling
      expect(enhanced[2].learningValue).toBe('medium') // style
    })

    it('should match suggestions with mistake patterns', () => {
      const suggestions: Suggestion[] = [
        {
          type: 'academic-style',
          position: 8,
          originalText: 'really',
          suggestedText: 'significantly',
          explanation: 'Use more formal language'
        }
      ]
      
      const text = 'This is really important research.'
      const enhanced = enhanceSuggestionsWithEducation(suggestions, text)
      
      expect(enhanced[0].educationalFeedback).toBeDefined()
      expect(enhanced[0].grammarRule).toBe('word-choice')
      expect(enhanced[0].mistakePattern).toBe('really')
    })
  })

  describe('generateEducationalReport', () => {
    it('should generate report for suggestions with educational feedback', () => {
      const suggestions = [
        {
          type: 'academic-style' as const,
          position: 0,
          originalText: 'really',
          suggestedText: 'significantly',
          explanation: 'Use formal language',
          learningValue: 'high' as const,
          grammarRule: 'word-choice',
          educationalFeedback: {
            ruleId: 'word-choice',
            ruleName: 'Academic Word Choice',
            category: 'vocabulary' as const,
            explanation: 'Choose precise vocabulary',
            examples: [],
            tips: [],
            difficulty: 'intermediate' as const,
            learningObjective: 'Select appropriate vocabulary'
          }
        }
      ]
      
      const report = generateEducationalReport(suggestions, 'This is really important.')
      
      expect(report.overallAssessment).toBeDefined()
      expect(report.keyLearningAreas).toBeDefined()
      expect(report.priorityRules).toBeDefined()
      expect(report.practiceRecommendations).toBeDefined()
      expect(report.progressIndicators).toBeDefined()
      expect(report.progressIndicators.strengthAreas).toBeDefined()
      expect(report.progressIndicators.improvementNeeded).toBeDefined()
      expect(report.progressIndicators.nextSteps).toBeDefined()
    })

    it('should provide positive assessment for no suggestions', () => {
      const report = generateEducationalReport([], 'Perfect academic writing.')
      
      expect(report.overallAssessment).toContain('Excellent work')
      expect(report.progressIndicators.strengthAreas.length).toBeGreaterThan(0)
    })

    it('should identify priority rules based on frequency', () => {
      const suggestions = [
        {
          type: 'grammar' as const,
          position: 0,
          originalText: 'test1',
          suggestedText: 'test1',
          explanation: 'Grammar error',
          learningValue: 'high' as const,
          grammarRule: 'subject-verb-agreement'
        },
        {
          type: 'grammar' as const,
          position: 10,
          originalText: 'test2',
          suggestedText: 'test2',
          explanation: 'Grammar error',
          learningValue: 'high' as const,
          grammarRule: 'subject-verb-agreement'
        }
      ]
      
      const report = generateEducationalReport(suggestions, 'test text')
      
      expect(report.priorityRules.length).toBeGreaterThan(0)
      expect(report.priorityRules[0].id).toBe('subject-verb-agreement')
    })

    it('should assess different levels of writing quality', () => {
      const highErrorSuggestions = Array(10).fill(null).map((_, i) => ({
        type: 'grammar' as const,
        position: i,
        originalText: 'test',
        suggestedText: 'test',
        explanation: 'Error',
        learningValue: 'high' as const,
        grammarRule: 'test-rule'
      }))
      
      const lowErrorSuggestions = Array(2).fill(null).map((_, i) => ({
        type: 'style' as const,
        position: i,
        originalText: 'test',
        suggestedText: 'test',
        explanation: 'Minor improvement',
        learningValue: 'low' as const
      }))
      
      const highErrorReport = generateEducationalReport(highErrorSuggestions, 'test')
      const lowErrorReport = generateEducationalReport(lowErrorSuggestions, 'test')
      
      expect(highErrorReport.overallAssessment).toContain('focus on fundamental')
      expect(lowErrorReport.overallAssessment).toContain('Strong writing')
    })
  })

  describe('getAllGrammarRules', () => {
    it('should return all available grammar rules', () => {
      const rules = getAllGrammarRules()
      
      expect(rules.length).toBeGreaterThan(5)
      expect(rules.some(rule => rule.id === 'subject-verb-agreement')).toBe(true)
      expect(rules.some(rule => rule.id === 'academic-tone')).toBe(true)
      expect(rules.some(rule => rule.id === 'word-choice')).toBe(true)
    })

    it('should return rules with all required properties', () => {
      const rules = getAllGrammarRules()
      
      rules.forEach(rule => {
        expect(rule.id).toBeDefined()
        expect(rule.name).toBeDefined()
        expect(rule.category).toBeDefined()
        expect(rule.description).toBeDefined()
        expect(rule.explanation).toBeDefined()
        expect(rule.examples).toBeDefined()
        expect(rule.difficulty).toBeDefined()
        expect(rule.commonMistakes).toBeDefined()
        expect(rule.tips).toBeDefined()
      })
    })
  })

  describe('searchGrammarRules', () => {
    it('should find rules by name', () => {
      const results = searchGrammarRules('agreement')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(rule => rule.name.toLowerCase().includes('agreement'))).toBe(true)
    })

    it('should find rules by description', () => {
      const results = searchGrammarRules('academic')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(rule => 
        rule.description.toLowerCase().includes('academic') ||
        rule.explanation.toLowerCase().includes('academic')
      )).toBe(true)
    })

    it('should find rules by common mistakes', () => {
      const results = searchGrammarRules('apostrophe')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(rule => rule.id === 'apostrophe-usage')).toBe(true)
    })

    it('should return empty array for non-matching search', () => {
      const results = searchGrammarRules('xyznomatch')
      expect(results).toEqual([])
    })

    it('should be case insensitive', () => {
      const lowerResults = searchGrammarRules('subject')
      const upperResults = searchGrammarRules('SUBJECT')
      const mixedResults = searchGrammarRules('Subject')
      
      expect(lowerResults).toEqual(upperResults)
      expect(lowerResults).toEqual(mixedResults)
      expect(lowerResults.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty text in mistake identification', () => {
      const mistakes = identifyMistakePatterns('')
      expect(mistakes).toEqual([])
    })

    it('should handle suggestions without educational feedback', () => {
      const suggestions: Suggestion[] = [
        {
          type: 'spelling',
          position: 0,
          originalText: 'teh',
          suggestedText: 'the',
          explanation: 'Spelling correction'
        }
      ]
      
      const enhanced = enhanceSuggestionsWithEducation(suggestions, 'teh text')
      
      expect(enhanced[0].educationalFeedback).toBeUndefined()
      expect(enhanced[0].learningValue).toBe('low')
      expect(enhanced[0].improvementTip).toBeDefined()
    })

    it('should handle multiple instances of same mistake pattern', () => {
      const text = 'This is really good and really important research.'
      const mistakes = identifyMistakePatterns(text)
      
      const reallyMistakes = mistakes.filter(m => m.pattern === 'really')
      expect(reallyMistakes.length).toBe(1)
      expect(reallyMistakes[0].positions.length).toBe(2)
    })
  })
}) 