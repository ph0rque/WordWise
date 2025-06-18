import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  checkAcademicGrammar, 
  isOpenAIAvailable, 
  getAcademicVocabularySuggestions,
  assessAcademicWritingLevel 
} from './academic-grammar-checker'

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  OPENAI_API_KEY: undefined as string | undefined,
}))

vi.mock('process', () => ({
  env: mockEnv,
}))

// Mock OpenAI dependencies
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    // Mock OpenAI client
  })),
}))

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('zod', () => ({
  z: {
    object: vi.fn(() => ({
      suggestions: vi.fn(),
    })),
    array: vi.fn(),
    enum: vi.fn(),
    number: vi.fn(() => ({ min: vi.fn(() => ({ max: vi.fn() })) })),
    string: vi.fn(() => ({ optional: vi.fn() })),
  },
}))

describe('Academic Grammar Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockEnv.OPENAI_API_KEY = undefined
  })

  describe('isOpenAIAvailable', () => {
    it('should return false when API key is not set', () => {
      mockEnv.OPENAI_API_KEY = undefined
      expect(isOpenAIAvailable()).toBe(false)
    })

    it('should return true when API key is set', () => {
      mockEnv.OPENAI_API_KEY = 'test-api-key'
      expect(isOpenAIAvailable()).toBe(true)
    })

    it('should return false when API key is empty string', () => {
      mockEnv.OPENAI_API_KEY = ''
      expect(isOpenAIAvailable()).toBe(false)
    })
  })

  describe('checkAcademicGrammar', () => {
    it('should return empty array for empty text', async () => {
      const result = await checkAcademicGrammar('')
      expect(result).toEqual([])
    })

    it('should return empty array for very short text', async () => {
      const result = await checkAcademicGrammar('Hi')
      expect(result).toEqual([])
    })

    it('should fall back to basic checker when OpenAI is not available', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "I can't believe this is gonna work."
      const result = await checkAcademicGrammar(text)
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      
      // Should detect contractions and informal language
      const hasContractionSuggestion = result.some(s => 
        s.type === 'academic-style' && s.originalText === "can't"
      )
      const hasInformalSuggestion = result.some(s => 
        s.type === 'academic-style' && s.originalText === "gonna"
      )
      
      expect(hasContractionSuggestion).toBe(true)
      expect(hasInformalSuggestion).toBe(true)
    })

    it('should detect first person pronouns in academic writing', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "I think this research shows that we need to consider our findings."
      const result = await checkAcademicGrammar(text)
      
      const firstPersonSuggestions = result.filter(s => 
        s.type === 'academic-style' && 
        ['I', 'we', 'our'].includes(s.originalText)
      )
      
      expect(firstPersonSuggestions.length).toBeGreaterThan(0)
      expect(firstPersonSuggestions[0].explanation).toContain('third person perspective')
    })

    it('should detect and expand contractions', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "This research doesn't show what we're looking for."
      const result = await checkAcademicGrammar(text)
      
      const contractionSuggestions = result.filter(s => 
        s.type === 'academic-style' && 
        s.originalText.includes("'")
      )
      
      expect(contractionSuggestions.length).toBe(2)
      expect(contractionSuggestions.find(s => s.originalText === "doesn't")?.suggestedText).toBe("does not")
      expect(contractionSuggestions.find(s => s.originalText === "we're")?.suggestedText).toBe("we are")
    })

    it('should detect informal language patterns', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "This stuff is really important and we gotta examine these things."
      const result = await checkAcademicGrammar(text)
      
      const informalSuggestions = result.filter(s => s.type === 'academic-style')
      
      expect(informalSuggestions.length).toBeGreaterThan(0)
      
      const stuffSuggestion = informalSuggestions.find(s => s.originalText === "stuff")
      expect(stuffSuggestion).toBeDefined()
      expect(stuffSuggestion?.explanation).toContain("formal academic language")
    })

    it('should handle different academic levels', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "This is a test sentence for analysis."
      
      const highSchoolResult = await checkAcademicGrammar(text, 'high-school')
      const collegeResult = await checkAcademicGrammar(text, 'college')
      
      expect(Array.isArray(highSchoolResult)).toBe(true)
      expect(Array.isArray(collegeResult)).toBe(true)
    })

    it('should handle subject-specific context', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = "This research shows important findings."
      const result = await checkAcademicGrammar(text, 'high-school', 'Biology')
      
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getAcademicVocabularySuggestions', () => {
    it('should return academic alternatives for common words', () => {
      expect(getAcademicVocabularySuggestions('show')).toContain('demonstrate')
      expect(getAcademicVocabularySuggestions('prove')).toContain('establish')
      expect(getAcademicVocabularySuggestions('say')).toContain('assert')
      expect(getAcademicVocabularySuggestions('think')).toContain('consider')
    })

    it('should return academic alternatives for descriptive words', () => {
      expect(getAcademicVocabularySuggestions('big')).toContain('significant')
      expect(getAcademicVocabularySuggestions('small')).toContain('minimal')
      expect(getAcademicVocabularySuggestions('good')).toContain('effective')
      expect(getAcademicVocabularySuggestions('bad')).toContain('detrimental')
    })

    it('should handle case insensitivity', () => {
      expect(getAcademicVocabularySuggestions('SHOW')).toContain('demonstrate')
      expect(getAcademicVocabularySuggestions('Show')).toContain('demonstrate')
      expect(getAcademicVocabularySuggestions('sHoW')).toContain('demonstrate')
    })

    it('should return empty array for words without alternatives', () => {
      expect(getAcademicVocabularySuggestions('xyz')).toEqual([])
      expect(getAcademicVocabularySuggestions('nonexistent')).toEqual([])
    })

    it('should return multiple alternatives when available', () => {
      const suggestions = getAcademicVocabularySuggestions('important')
      expect(suggestions.length).toBeGreaterThan(1)
      expect(suggestions).toContain('crucial')
      expect(suggestions).toContain('significant')
    })
  })

  describe('assessAcademicWritingLevel', () => {
    it('should assess advanced level for sophisticated academic writing', () => {
      const text = `
        Furthermore, this comprehensive analysis demonstrates that the methodology 
        employed in the investigation establishes significant correlations between 
        the variables. Consequently, the findings illustrate the substantial impact 
        of environmental factors on academic performance. Moreover, the research 
        reveals crucial insights that contribute to our understanding of this phenomenon.
      `
      
      const assessment = assessAcademicWritingLevel(text)
      
      expect(assessment.score).toBeGreaterThan(85)
      expect(assessment.level).toBe('advanced')
      expect(assessment.feedback.length).toBeLessThan(2)
    })

    it('should assess below-standard level for informal writing', () => {
      const text = `
        I think this stuff is really important and we gotta look at these things. 
        It's gonna show us what we need to know. This research doesn't prove anything.
      `
      
      const assessment = assessAcademicWritingLevel(text)
      
      expect(assessment.score).toBeLessThan(60)
      expect(assessment.level).toBe('below-standard')
      expect(assessment.feedback.length).toBeGreaterThan(0)
      expect(assessment.feedback.join(' ')).toContain('informal')
    })

    it('should assess proficient level for good academic writing', () => {
      const text = `
        This research demonstrates important findings about student performance. 
        The analysis reveals significant patterns in the data. However, additional 
        investigation is necessary to establish definitive conclusions.
      `
      
      const assessment = assessAcademicWritingLevel(text)
      
      expect(assessment.score).toBeGreaterThanOrEqual(75)
      expect(assessment.score).toBeLessThan(90)
      expect(assessment.level).toBe('proficient')
    })

    it('should assess developing level for mixed writing quality', () => {
      const text = `
        The research shows some important results. However, there are limitations 
        that need consideration. The findings demonstrate potential for further study.
      `
      
      const assessment = assessAcademicWritingLevel(text)
      
      expect(assessment.score).toBeGreaterThanOrEqual(60)
      expect(assessment.score).toBeLessThan(75)
      expect(assessment.level).toBe('developing')
    })

    it('should provide specific feedback for different issues', () => {
      const shortSentenceText = "This is short. Very short. Too short."
      const assessment1 = assessAcademicWritingLevel(shortSentenceText)
      expect(assessment1.feedback.some(f => f.includes('sentence length'))).toBe(true)

      const informalText = "I can't believe this stuff is gonna work."
      const assessment2 = assessAcademicWritingLevel(informalText)
      expect(assessment2.feedback.some(f => f.includes('informal'))).toBe(true)

      const basicVocabText = "This thing is good and shows important stuff."
      const assessment3 = assessAcademicWritingLevel(basicVocabText)
      expect(assessment3.feedback.some(f => f.includes('academic vocabulary'))).toBe(true)
    })

    it('should handle empty or very short text gracefully', () => {
      const assessment1 = assessAcademicWritingLevel('')
      expect(assessment1.score).toBeGreaterThanOrEqual(0)
      expect(assessment1.level).toBeDefined()

      const assessment2 = assessAcademicWritingLevel('Short.')
      expect(assessment2.score).toBeGreaterThanOrEqual(0)
      expect(assessment2.level).toBeDefined()
    })

    it('should never return negative scores', () => {
      const terribleText = "I can't believe this stuff is gonna work and things are really bad."
      const assessment = assessAcademicWritingLevel(terribleText)
      expect(assessment.score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complex academic text with multiple issue types', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const text = `
        I think this research can't prove what we're trying to show. The stuff 
        we found is really important but it doesn't demonstrate our hypothesis.
      `
      
      const result = await checkAcademicGrammar(text)
      
      // Should detect multiple types of issues
      const hasFirstPerson = result.some(s => s.originalText === 'I')
      const hasContractions = result.some(s => s.originalText.includes("'"))
      const hasInformal = result.some(s => s.originalText === 'stuff')
      
      expect(hasFirstPerson).toBe(true)
      expect(hasContractions).toBe(true)
      expect(hasInformal).toBe(true)
      
      // All suggestions should have required fields
      result.forEach(suggestion => {
        expect(suggestion.type).toBeDefined()
        expect(suggestion.position).toBeGreaterThanOrEqual(0)
        expect(suggestion.originalText).toBeDefined()
        expect(suggestion.suggestedText).toBeDefined()
        expect(suggestion.explanation).toBeDefined()
        expect(suggestion.severity).toBeDefined()
        expect(suggestion.confidence).toBeDefined()
      })
    })

    it('should maintain suggestion quality across different text lengths', async () => {
      mockEnv.OPENAI_API_KEY = undefined
      
      const shortText = "I can't do this."
      const longText = `
        I believe this research can't demonstrate what we're trying to prove. 
        The stuff we discovered is really important, but it doesn't show our 
        hypothesis is correct. We gotta examine these things more carefully.
      `
      
      const shortResult = await checkAcademicGrammar(shortText)
      const longResult = await checkAcademicGrammar(longText)
      
      expect(shortResult.length).toBeGreaterThan(0)
      expect(longResult.length).toBeGreaterThan(shortResult.length)
      
      // All suggestions should be valid
      const allSuggestions = [...shortResult, ...longResult]
      allSuggestions.forEach(suggestion => {
        expect(suggestion.position).toBeGreaterThanOrEqual(0)
        expect(suggestion.originalText.length).toBeGreaterThan(0)
        expect(suggestion.explanation.length).toBeGreaterThan(0)
      })
    })
  })
}) 