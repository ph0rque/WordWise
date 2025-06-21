import {
  analyzeVocabulary,
  enhanceVocabulary,
  suggestTransitionWords,
  getAcademicWordSuggestions,
  VocabularyAnalysis,
  VocabularyEnhancement
} from './vocabulary'

describe('Vocabulary Analysis', () => {
  describe('analyzeVocabulary', () => {
    it('should return empty analysis for empty text', () => {
      const analysis = analyzeVocabulary('')
      
      expect(analysis.totalWords).toBe(0)
      expect(analysis.uniqueWords).toBe(0)
      expect(analysis.academicWords).toBe(0)
      expect(analysis.informalWords).toBe(0)
      expect(analysis.repetitiveWords).toHaveLength(0)
      expect(analysis.vocabularyDiversity).toBe(0)
      expect(analysis.academicLevel).toBe('elementary')
      expect(analysis.suggestions).toHaveLength(0)
    })

    it('should analyze basic text statistics', () => {
      const text = 'The students need to analyze the data carefully.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.totalWords).toBe(8)
      expect(analysis.uniqueWords).toBe(7) // 'the' appears twice
      expect(analysis.academicWords).toBeGreaterThan(0) // 'analyze' is academic
      expect(analysis.vocabularyDiversity).toBeGreaterThan(0)
    })

    it('should identify academic vocabulary correctly', () => {
      const text = 'Students must analyze, evaluate, and synthesize the evidence to demonstrate their hypothesis.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.academicWords).toBeGreaterThan(3) // analyze, evaluate, synthesize, demonstrate, hypothesis
      expect(analysis.academicLevel).toMatch(/high-school|college/)
    })

    it('should identify informal words', () => {
      const text = 'This is really good stuff that shows big things.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.informalWords).toBeGreaterThan(3) // really, good, stuff, shows, big, things
      expect(analysis.suggestions.length).toBeGreaterThan(0)
    })

    it('should detect repetitive words', () => {
      const text = 'The research shows that research is important. Research findings demonstrate that research methods are crucial for research validity.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.repetitiveWords).toContain('research')
    })

    it('should calculate vocabulary diversity', () => {
      const diverseText = 'Students must analyze, evaluate, synthesize, demonstrate, investigate, examine, and interpret academic evidence.'
      const repetitiveText = 'The cat sat on the mat. The cat was big. The cat was happy.'
      
      const diverseAnalysis = analyzeVocabulary(diverseText, 'high-school')
      const repetitiveAnalysis = analyzeVocabulary(repetitiveText, 'high-school')
      
      expect(diverseAnalysis.vocabularyDiversity).toBeGreaterThan(repetitiveAnalysis.vocabularyDiversity)
    })

    it('should determine academic level appropriately', () => {
      const elementaryText = 'The cat is big. The dog is small.'
      const collegeText = 'The epistemological paradigm necessitates a comprehensive examination of theoretical frameworks.'
      
      const elementaryAnalysis = analyzeVocabulary(elementaryText, 'high-school')
      const collegeAnalysis = analyzeVocabulary(collegeText, 'college')
      
      expect(elementaryAnalysis.academicLevel).toBe('elementary')
      expect(collegeAnalysis.academicLevel).toBe('adult')
    })

    it('should generate vocabulary suggestions', () => {
      const text = 'This is really good stuff that shows big problems.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.suggestions.length).toBeGreaterThan(0)
      expect(analysis.suggestions[0]).toHaveProperty('originalWord')
      expect(analysis.suggestions[0]).toHaveProperty('suggestions')
      expect(analysis.suggestions[0]).toHaveProperty('reason')
      expect(analysis.suggestions[0]).toHaveProperty('priority')
      expect(analysis.suggestions[0]).toHaveProperty('explanation')
    })

    it('should handle different target levels', () => {
      const text = 'Students must analyze the data to understand the research findings.'
      
      const highSchoolAnalysis = analyzeVocabulary(text, 'high-school')
      const collegeAnalysis = analyzeVocabulary(text, 'college')
      
      expect(highSchoolAnalysis.academicWords).toBeDefined()
      expect(collegeAnalysis.academicWords).toBeDefined()
      // College level should have different expectations
      expect(collegeAnalysis.suggestions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('enhanceVocabulary', () => {
    it('should provide feedback for empty text', () => {
      const enhancement = enhanceVocabulary('')
      
      expect(enhancement.overallScore).toBe(0)
      expect(enhancement.strengths).toHaveLength(0)
      expect(enhancement.improvementAreas).toContain('Add content to receive vocabulary feedback')
      expect(enhancement.recommendations).toContain('Write some text to get vocabulary enhancement suggestions')
    })

    it('should provide positive feedback for good academic vocabulary', () => {
      const text = 'Students must analyze and evaluate the evidence to demonstrate their understanding of complex theoretical frameworks.'
      const enhancement = enhanceVocabulary(text, 'high-school')
      
      expect(enhancement.overallScore).toBeGreaterThan(50)
      expect(enhancement.strengths.length).toBeGreaterThan(0)
      expect(enhancement.strengths).toContain('Strong use of academic vocabulary')
    })

    it('should identify areas for improvement', () => {
      const text = 'This is really good stuff that shows big things.'
      const enhancement = enhanceVocabulary(text, 'high-school')
      
      expect(enhancement.overallScore).toBeLessThan(50)
      expect(enhancement.improvementAreas).toContain('Too many informal words')
      expect(enhancement.recommendations).toContain('Replace informal words with academic alternatives')
    })

    it('should assess vocabulary diversity', () => {
      const diverseText = 'Students must analyze, evaluate, synthesize, demonstrate, investigate, examine, and interpret academic evidence comprehensively.'
      const repetitiveText = 'The research shows research. Research is research. Research research research.'
      
      const diverseEnhancement = enhanceVocabulary(diverseText, 'high-school')
      const repetitiveEnhancement = enhanceVocabulary(repetitiveText, 'high-school')
      
      expect(diverseEnhancement.strengths).toContain('Excellent vocabulary diversity')
      expect(repetitiveEnhancement.improvementAreas).toContain('Limited vocabulary variety')
    })

    it('should provide different feedback for different target levels', () => {
      const text = 'Students analyze data to understand research findings.'
      
      const highSchoolEnhancement = enhanceVocabulary(text, 'high-school')
      const collegeEnhancement = enhanceVocabulary(text, 'college')
      
      expect(highSchoolEnhancement.recommendations).toBeDefined()
      expect(collegeEnhancement.recommendations).toBeDefined()
      // College level should expect more sophisticated vocabulary
      expect(collegeEnhancement.recommendations.join(' ')).toMatch(/sophisticated|technical|discipline/)
    })

    it('should assess formality appropriately', () => {
      const formalText = 'Researchers must examine and evaluate the evidence to establish significant conclusions.'
      const informalText = 'People need to look at stuff and figure out what it means.'
      
      const formalEnhancement = enhanceVocabulary(formalText, 'high-school')
      const informalEnhancement = enhanceVocabulary(informalText, 'high-school')
      
      expect(formalEnhancement.strengths).toContain('Appropriate formality level')
      expect(informalEnhancement.improvementAreas).toContain('Limited academic vocabulary usage')
    })

    it('should handle repetitive word usage', () => {
      const repetitiveText = 'The research shows that research is important. Research findings demonstrate that research methods are crucial for research validity.'
      const enhancement = enhanceVocabulary(repetitiveText, 'high-school')
      
      expect(enhancement.improvementAreas).toContain('Repetitive word usage')
      expect(enhancement.recommendations.some(r => r.includes('research'))).toBe(true)
    })

    it('should calculate overall score appropriately', () => {
      const excellentText = 'Students must systematically analyze and evaluate comprehensive evidence to demonstrate their sophisticated understanding of complex theoretical frameworks.'
      const poorText = 'This is really bad stuff that shows big problems.'
      
      const excellentEnhancement = enhanceVocabulary(excellentText, 'high-school')
      const poorEnhancement = enhanceVocabulary(poorText, 'high-school')
      
      expect(excellentEnhancement.overallScore).toBeGreaterThan(70)
      expect(poorEnhancement.overallScore).toBeLessThan(40)
    })
  })

  describe('suggestTransitionWords', () => {
    it('should suggest addition transition words', () => {
      const suggestions = suggestTransitionWords('addition')
      
      expect(suggestions).toContain('furthermore')
      expect(suggestions).toContain('moreover')
      expect(suggestions).toContain('additionally')
      expect(suggestions.length).toBeGreaterThan(3)
    })

    it('should suggest contrast transition words', () => {
      const suggestions = suggestTransitionWords('contrast')
      
      expect(suggestions).toContain('however')
      expect(suggestions).toContain('nevertheless')
      expect(suggestions).toContain('conversely')
    })

    it('should suggest cause transition words', () => {
      const suggestions = suggestTransitionWords('cause')
      
      expect(suggestions).toContain('therefore')
      expect(suggestions).toContain('consequently')
      expect(suggestions).toContain('thus')
    })

    it('should suggest sequence transition words', () => {
      const suggestions = suggestTransitionWords('sequence')
      
      expect(suggestions).toContain('first')
      expect(suggestions).toContain('subsequently')
      expect(suggestions).toContain('finally')
    })

    it('should suggest emphasis transition words', () => {
      const suggestions = suggestTransitionWords('emphasis')
      
      expect(suggestions).toContain('indeed')
      expect(suggestions).toContain('certainly')
      expect(suggestions).toContain('particularly')
    })

    it('should suggest example transition words', () => {
      const suggestions = suggestTransitionWords('example')
      
      expect(suggestions).toContain('for instance')
      expect(suggestions).toContain('specifically')
      expect(suggestions).toContain('namely')
    })
  })

  describe('getAcademicWordSuggestions', () => {
    it('should return elementary academic words', () => {
      const words = getAcademicWordSuggestions('elementary')
      
      expect(words).toContain('important')
      expect(words).toContain('different')
      expect(words).toContain('example')
      expect(words.length).toBeGreaterThan(5)
    })

    it('should return middle school academic words', () => {
      const words = getAcademicWordSuggestions('middle-school')
      
      expect(words).toContain('analyze')
      expect(words).toContain('evaluate')
      expect(words).toContain('evidence')
    })

    it('should return high school academic words', () => {
      const words = getAcademicWordSuggestions('high-school')
      
      expect(words).toContain('synthesize')
      expect(words).toContain('demonstrate')
      expect(words).toContain('furthermore')
    })

    it('should return college academic words', () => {
      const words = getAcademicWordSuggestions('college')
      
      expect(words).toContain('paradigm')
      expect(words).toContain('methodology')
      expect(words).toContain('hypothesis')
    })

    it('should return empty array for invalid level', () => {
      const words = getAcademicWordSuggestions('invalid' as any)
      
      expect(words).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle text with only punctuation', () => {
      const analysis = analyzeVocabulary('!!! ??? ...')
      
      expect(analysis.totalWords).toBe(0)
      expect(analysis.uniqueWords).toBe(0)
    })

    it('should handle text with numbers and special characters', () => {
      const text = 'The study analyzed 1,234 participants using statistical methods.'
      const analysis = analyzeVocabulary(text)
      
      expect(analysis.totalWords).toBeGreaterThan(5)
      expect(analysis.academicWords).toBeGreaterThan(0) // 'analyzed' is academic
    })

    it('should handle very short text', () => {
      const text = 'Analyze.'
      const analysis = analyzeVocabulary(text)
      
      expect(analysis.totalWords).toBe(1)
      expect(analysis.academicWords).toBe(1)
    })

    it('should handle mixed case text', () => {
      const text = 'STUDENTS must ANALYZE the DATA carefully.'
      const analysis = analyzeVocabulary(text)
      
      expect(analysis.totalWords).toBe(6)
      expect(analysis.academicWords).toBeGreaterThan(0)
    })

    it('should handle text with unusual formatting', () => {
      const text = `   Multiple    spaces   between    words.
      
      
      Extra line breaks.    `
      
      const analysis = analyzeVocabulary(text)
      
      expect(analysis.totalWords).toBe(7)
      expect(analysis.uniqueWords).toBe(7)
    })
  })

  describe('suggestion generation', () => {
    it('should generate high priority suggestions for informal words', () => {
      const text = 'This is really good stuff.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      const highPrioritySuggestions = analysis.suggestions.filter(s => s.priority === 'high')
      expect(highPrioritySuggestions.length).toBeGreaterThan(0)
    })

    it('should include context in suggestions', () => {
      const text = 'The research shows that this is really important evidence.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      const suggestion = analysis.suggestions.find(s => s.originalWord === 'really')
      expect(suggestion?.context).toBeDefined()
      expect(suggestion?.context).toContain('really')
    })

    it('should provide explanations for suggestions', () => {
      const text = 'This is really good.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.suggestions[0].explanation).toBeDefined()
      expect(analysis.suggestions[0].explanation.length).toBeGreaterThan(10)
    })

    it('should limit suggestions to avoid overwhelming users', () => {
      const text = 'This is really very good stuff that shows big things and makes good points about very important stuff.'
      const analysis = analyzeVocabulary(text, 'high-school')
      
      expect(analysis.suggestions.length).toBeLessThanOrEqual(10)
    })
  })
}) 