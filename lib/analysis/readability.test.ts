import {
  calculateReadabilityMetrics,
  assessReadability,
  interpretReadabilityScore,
  ReadabilityMetrics,
  ReadabilityAssessment
} from './readability'

describe('Readability Analysis', () => {
  describe('calculateReadabilityMetrics', () => {
    it('should return zero metrics for empty text', () => {
      const metrics = calculateReadabilityMetrics('')
      
      expect(metrics.wordCount).toBe(0)
      expect(metrics.sentenceCount).toBe(0)
      expect(metrics.syllableCount).toBe(0)
      expect(metrics.fleschReadingEase).toBe(0)
      expect(metrics.fleschKincaidGradeLevel).toBe(0)
      expect(metrics.appropriateForLevel).toBe(false)
    })

    it('should calculate basic metrics for simple text', () => {
      const text = 'The cat sat on the mat. It was a sunny day.'
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.wordCount).toBe(11)
      expect(metrics.sentenceCount).toBe(2)
      expect(metrics.syllableCount).toBeGreaterThan(0)
      expect(metrics.averageWordsPerSentence).toBe(5.5)
      expect(metrics.readingLevel).toBeDefined()
    })

    it('should calculate metrics for high school level text', () => {
      const text = `The American Revolution was a significant historical event that established the United States as an independent nation. 
      The colonists fought against British rule because they believed in fundamental principles of democracy and self-governance. 
      This conflict demonstrated the importance of perseverance and unity in achieving political independence.`
      
      const metrics = calculateReadabilityMetrics(text, 'high-school')
      
      expect(metrics.wordCount).toBeGreaterThan(30)
      expect(metrics.academicVocabularyPercentage).toBeGreaterThan(0)
      expect(metrics.complexWordPercentage).toBeGreaterThan(0)
      expect(metrics.fleschKincaidGradeLevel).toBeGreaterThan(5)
    })

    it('should calculate metrics for college level text', () => {
      const text = `The epistemological paradigm underlying contemporary educational methodology necessitates a comprehensive 
      examination of pedagogical frameworks. This theoretical discourse substantiates the hypothesis that empirical 
      research corroborates the efficacy of interdisciplinary approaches in academic curricula.`
      
      const metrics = calculateReadabilityMetrics(text, 'college')
      
      expect(metrics.wordCount).toBeGreaterThan(20)
      expect(metrics.academicVocabularyPercentage).toBeGreaterThan(10)
      expect(metrics.complexWordPercentage).toBeGreaterThan(20)
      expect(metrics.fleschKincaidGradeLevel).toBeGreaterThan(10)
    })

    it('should identify academic vocabulary correctly', () => {
      const text = 'We need to analyze and evaluate the significant evidence to demonstrate our hypothesis.'
      const metrics = calculateReadabilityMetrics(text, 'high-school')
      
      expect(metrics.academicVocabularyPercentage).toBeGreaterThan(20) // analyze, evaluate, significant, demonstrate, hypothesis
    })

    it('should handle text with multiple paragraphs', () => {
      const text = `First paragraph with some content here.

      Second paragraph with different content.
      
      Third paragraph to test paragraph counting.`
      
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.paragraphCount).toBe(3)
      expect(metrics.wordCount).toBeGreaterThan(10)
    })

    it('should calculate appropriate level assessment', () => {
      // Simple high school level text
      const simpleText = 'Students should study hard for their exams. Good preparation leads to better results.'
      const simpleMetrics = calculateReadabilityMetrics(simpleText, 'high-school')
      
      // Complex college level text
      const complexText = `The phenomenological approach to qualitative research methodology requires rigorous epistemological 
      considerations that substantiate the theoretical framework underlying empirical investigations.`
      const complexMetrics = calculateReadabilityMetrics(complexText, 'college')
      
      expect(simpleMetrics.readingLevel).toBe('high-school')
      expect(complexMetrics.readingLevel).toMatch(/college|graduate/)
    })
  })

  describe('assessReadability', () => {
    it('should provide feedback for empty text', () => {
      const assessment = assessReadability('')
      
      expect(assessment.feedback).toContain('No text to analyze')
      expect(assessment.recommendations).toContain('Add content to receive readability feedback')
      expect(assessment.strengths).toHaveLength(0)
      expect(assessment.improvementAreas).toHaveLength(0)
    })

    it('should provide positive feedback for appropriate level text', () => {
      const text = `Climate change represents one of the most significant challenges facing our planet today. 
      Scientists have conducted extensive research to understand the complex factors contributing to global warming. 
      The evidence clearly demonstrates that human activities, particularly fossil fuel consumption, are the primary drivers of this phenomenon.`
      
      const assessment = assessReadability(text, 'high-school')
      
      expect(assessment.feedback.length).toBeGreaterThan(0)
      expect(assessment.recommendations.length).toBeGreaterThan(0)
      expect(assessment.strengths.length).toBeGreaterThan(0)
    })

    it('should identify areas for improvement in simple text', () => {
      const text = 'The cat is big. The dog is small. They are pets.'
      const assessment = assessReadability(text, 'high-school')
      
      expect(assessment.improvementAreas).toContain('Increase vocabulary sophistication')
      expect(assessment.recommendations).toContain('Incorporate more academic vocabulary and transition words')
    })

    it('should identify overly complex text', () => {
      const text = `The epistemological underpinnings of phenomenological hermeneutics necessitate a comprehensive 
      examination of ontological presuppositions that fundamentally characterize the methodological paradigm 
      underlying contemporary interdisciplinary research methodologies.`
      
      const assessment = assessReadability(text, 'high-school')
      
      expect(assessment.improvementAreas).toContain('Simplify overly complex sentences')
      expect(assessment.recommendations).toContain('Break down long sentences into shorter, clearer ones')
    })

    it('should provide different feedback for different target levels', () => {
      const text = 'Students must analyze the data carefully to understand the research findings.'
      
      const highSchoolAssessment = assessReadability(text, 'high-school')
      const collegeAssessment = assessReadability(text, 'college')
      
      expect(highSchoolAssessment.feedback).toBeDefined()
      expect(collegeAssessment.feedback).toBeDefined()
      // College level should expect more complexity
      expect(collegeAssessment.feedback.join(' ')).toMatch(/complexity|sophisticated/)
    })

    it('should analyze sentence length appropriately', () => {
      const shortSentences = 'I went. She came. We talked.'
      const longSentences = `This is an extremely long sentence that goes on and on without really saying much of anything important or meaningful, which makes it difficult to read and understand, and therefore should probably be broken up into smaller, more manageable pieces that are easier for readers to process and comprehend effectively.`
      
      const shortAssessment = assessReadability(shortSentences, 'high-school')
      const longAssessment = assessReadability(longSentences, 'high-school')
      
      expect(shortAssessment.improvementAreas).toContain('Sentence length too short')
      expect(longAssessment.improvementAreas).toContain('Sentences too long')
    })

    it('should assess academic vocabulary usage', () => {
      const academicText = 'Researchers must analyze, evaluate, and synthesize the evidence to establish significant conclusions.'
      const casualText = 'People need to look at stuff and figure out what it means.'
      
      const academicAssessment = assessReadability(academicText, 'high-school')
      const casualAssessment = assessReadability(casualText, 'high-school')
      
      expect(academicAssessment.strengths).toContain('Strong use of academic vocabulary')
      expect(casualAssessment.improvementAreas).toContain('Limited academic vocabulary')
    })
  })

  describe('interpretReadabilityScore', () => {
    it('should interpret Flesch Reading Ease scores correctly', () => {
      expect(interpretReadabilityScore(95, 'flesch')).toContain('Very Easy')
      expect(interpretReadabilityScore(85, 'flesch')).toContain('Easy')
      expect(interpretReadabilityScore(75, 'flesch')).toContain('Fairly Easy')
      expect(interpretReadabilityScore(65, 'flesch')).toContain('Standard')
      expect(interpretReadabilityScore(55, 'flesch')).toContain('Fairly Difficult')
      expect(interpretReadabilityScore(35, 'flesch')).toContain('Difficult')
      expect(interpretReadabilityScore(25, 'flesch')).toContain('Very Difficult')
    })

    it('should interpret grade level scores correctly', () => {
      expect(interpretReadabilityScore(5, 'grade-level')).toBe('Elementary School')
      expect(interpretReadabilityScore(7, 'grade-level')).toBe('Middle School')
      expect(interpretReadabilityScore(10, 'grade-level')).toBe('High School')
      expect(interpretReadabilityScore(14, 'grade-level')).toBe('College')
      expect(interpretReadabilityScore(18, 'grade-level')).toBe('Graduate School')
    })
  })

  describe('edge cases', () => {
    it('should handle text with only punctuation', () => {
      const metrics = calculateReadabilityMetrics('!!! ??? ...')
      
      expect(metrics.wordCount).toBe(0)
      expect(metrics.sentenceCount).toBe(0)
    })

    it('should handle text with numbers and special characters', () => {
      const text = 'The study included 1,234 participants from 5 different countries (USA, UK, Canada, etc.).'
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.wordCount).toBeGreaterThan(10)
      expect(metrics.sentenceCount).toBe(1)
    })

    it('should handle very short text', () => {
      const text = 'Hello.'
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.wordCount).toBe(1)
      expect(metrics.sentenceCount).toBe(1)
      expect(metrics.syllableCount).toBe(2)
    })

    it('should handle text with unusual formatting', () => {
      const text = `   Multiple    spaces   between    words.
      
      
      Extra line breaks.    `
      
      const metrics = calculateReadabilityMetrics(text)
      
      expect(metrics.wordCount).toBe(7)
      expect(metrics.sentenceCount).toBe(2)
    })
  })

  describe('syllable counting accuracy', () => {
    it('should count syllables correctly for common words', () => {
      // This tests the internal syllable counting logic indirectly
      const singleSyllable = 'cat dog run big'
      const doubleSyllable = 'water paper music happy'
      const tripleSyllable = 'elephant beautiful computer'
      
      const singleMetrics = calculateReadabilityMetrics(singleSyllable)
      const doubleMetrics = calculateReadabilityMetrics(doubleSyllable)
      const tripleMetrics = calculateReadabilityMetrics(tripleSyllable)
      
      expect(singleMetrics.averageSyllablesPerWord).toBeLessThan(1.5)
      expect(doubleMetrics.averageSyllablesPerWord).toBeGreaterThan(1.5)
      expect(doubleMetrics.averageSyllablesPerWord).toBeLessThan(2.5)
      expect(tripleMetrics.averageSyllablesPerWord).toBeGreaterThan(2.5)
    })
  })
}) 