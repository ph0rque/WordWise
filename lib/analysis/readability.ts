// Readability analysis utilities for academic writing assessment
// Implements multiple readability formulas for comprehensive text analysis

export interface ReadabilityMetrics {
  // Basic text statistics
  wordCount: number
  sentenceCount: number
  syllableCount: number
  characterCount: number
  paragraphCount: number
  
  // Readability scores
  fleschReadingEase: number
  fleschKincaidGradeLevel: number
  colemanLiauIndex: number
  automatedReadabilityIndex: number
  gunningFogIndex: number
  
  // Academic writing metrics
  averageWordsPerSentence: number
  averageSyllablesPerWord: number
  complexWordPercentage: number
  academicVocabularyPercentage: number
  
  // Grade level assessments
  recommendedGradeLevel: number
  readingLevel: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate'
  appropriateForLevel: boolean
}

export interface ReadabilityAssessment {
  metrics: ReadabilityMetrics
  feedback: string[]
  recommendations: string[]
  strengths: string[]
  improvementAreas: string[]
}

// Academic vocabulary lists for different levels
const ACADEMIC_VOCABULARY = {
  highSchool: [
    'analyze', 'synthesize', 'evaluate', 'demonstrate', 'establish', 'investigate',
    'examine', 'illustrate', 'interpret', 'justify', 'compare', 'contrast',
    'furthermore', 'moreover', 'consequently', 'therefore', 'nevertheless', 'however',
    'significant', 'substantial', 'comprehensive', 'extensive', 'crucial', 'essential'
  ],
  college: [
    'paradigm', 'methodology', 'hypothesis', 'theoretical', 'empirical', 'substantiate',
    'corroborate', 'extrapolate', 'juxtapose', 'dichotomy', 'synthesis', 'discourse',
    'epistemology', 'ontology', 'phenomenology', 'hermeneutics', 'dialectical'
  ]
}

// Complex words (3+ syllables) that indicate advanced vocabulary
const COMPLEX_WORD_PATTERNS = [
  /\w{3,}tion$/, /\w{3,}sion$/, /\w{3,}ment$/, /\w{3,}ness$/,
  /\w{3,}able$/, /\w{3,}ible$/, /\w{3,}ical$/, /\w{3,}ous$/
]

/**
 * Count syllables in a word using phonetic rules
 */
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0
  
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length === 0) return 0
  
  // Handle special cases
  const specialCases: Record<string, number> = {
    'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'but': 1,
    'through': 1, 'though': 1, 'enough': 2, 'cough': 1,
    'people': 2, 'every': 2, 'very': 2, 'over': 2,
    'area': 2, 'idea': 2, 'real': 1, 'create': 2
  }
  
  if (specialCases[word]) {
    return specialCases[word]
  }
  
  // Count vowel groups
  let syllables = 0
  let previousWasVowel = false
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i]
    const isVowel = 'aeiouy'.includes(char)
    
    if (isVowel && !previousWasVowel) {
      syllables++
    }
    previousWasVowel = isVowel
  }
  
  // Handle silent 'e'
  if (word.endsWith('e') && syllables > 1) {
    syllables--
  }
  
  // Handle 'le' endings
  if (word.endsWith('le') && word.length > 2 && !'aeiouy'.includes(word[word.length - 3])) {
    syllables++
  }
  
  // Minimum of 1 syllable
  return Math.max(1, syllables)
}

/**
 * Check if a word is considered complex (3+ syllables or matches complex patterns)
 */
function isComplexWord(word: string): boolean {
  if (word.length < 3) return false
  
  const syllables = countSyllables(word)
  if (syllables >= 3) return true
  
  return COMPLEX_WORD_PATTERNS.some(pattern => pattern.test(word.toLowerCase()))
}

/**
 * Check if a word is academic vocabulary
 */
function isAcademicVocabulary(word: string, level: 'high-school' | 'college' = 'high-school'): boolean {
  const lowerWord = word.toLowerCase()
  return ACADEMIC_VOCABULARY.highSchool.includes(lowerWord) ||
         (level === 'college' && ACADEMIC_VOCABULARY.college.includes(lowerWord))
}

/**
 * Calculate basic text statistics
 */
function calculateTextStatistics(text: string): {
  wordCount: number
  sentenceCount: number
  syllableCount: number
  characterCount: number
  paragraphCount: number
  words: string[]
} {
  if (!text.trim()) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      characterCount: 0,
      paragraphCount: 0,
      words: []
    }
  }
  
  // Clean and split text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  const words = cleanText.split(/\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0)
  
  // Calculate syllables
  const syllableCount = words.reduce((total, word) => {
    const cleanWord = word.replace(/[^\w]/g, '')
    return total + countSyllables(cleanWord)
  }, 0)
  
  return {
    wordCount: words.length,
    sentenceCount: Math.max(1, sentences.length),
    syllableCount,
    characterCount: cleanText.length,
    paragraphCount: Math.max(1, paragraphs.length),
    words: words.map(word => word.replace(/[^\w]/g, '').toLowerCase()).filter(w => w.length > 0)
  }
}

/**
 * Calculate Flesch Reading Ease score
 * Formula: 206.835 - (1.015 × ASL) - (84.6 × ASW)
 * Where ASL = Average Sentence Length, ASW = Average Syllables per Word
 */
function calculateFleschReadingEase(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const averageSentenceLength = wordCount / sentenceCount
  const averageSyllablesPerWord = syllableCount / wordCount
  
  return 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord)
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: (0.39 × ASL) + (11.8 × ASW) - 15.59
 */
function calculateFleschKincaidGradeLevel(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const averageSentenceLength = wordCount / sentenceCount
  const averageSyllablesPerWord = syllableCount / wordCount
  
  return (0.39 * averageSentenceLength) + (11.8 * averageSyllablesPerWord) - 15.59
}

/**
 * Calculate Coleman-Liau Index
 * Formula: 0.0588 × L - 0.296 × S - 15.8
 * Where L = average letters per 100 words, S = average sentences per 100 words
 */
function calculateColemanLiauIndex(
  wordCount: number,
  sentenceCount: number,
  characterCount: number
): number {
  if (wordCount === 0) return 0
  
  const L = (characterCount / wordCount) * 100
  const S = (sentenceCount / wordCount) * 100
  
  return 0.0588 * L - 0.296 * S - 15.8
}

/**
 * Calculate Automated Readability Index (ARI)
 * Formula: 4.71 × (characters/words) + 0.5 × (words/sentences) - 21.43
 */
function calculateAutomatedReadabilityIndex(
  wordCount: number,
  sentenceCount: number,
  characterCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const charactersPerWord = characterCount / wordCount
  const wordsPerSentence = wordCount / sentenceCount
  
  return 4.71 * charactersPerWord + 0.5 * wordsPerSentence - 21.43
}

/**
 * Calculate Gunning Fog Index
 * Formula: 0.4 × (ASL + percentage of complex words)
 */
function calculateGunningFogIndex(
  wordCount: number,
  sentenceCount: number,
  complexWordCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const averageSentenceLength = wordCount / sentenceCount
  const complexWordPercentage = (complexWordCount / wordCount) * 100
  
  return 0.4 * (averageSentenceLength + complexWordPercentage)
}

/**
 * Determine reading level from grade level score
 */
function getReadingLevel(gradeLevel: number): 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate' {
  if (gradeLevel < 6) return 'elementary'
  if (gradeLevel < 9) return 'middle-school'
  if (gradeLevel < 13) return 'high-school'
  if (gradeLevel < 16) return 'college'
  return 'graduate'
}

/**
 * Calculate comprehensive readability metrics
 */
export function calculateReadabilityMetrics(
  text: string,
  targetLevel: 'high-school' | 'college' = 'high-school'
): ReadabilityMetrics {
  const stats = calculateTextStatistics(text)
  
  if (stats.wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      characterCount: 0,
      paragraphCount: 0,
      fleschReadingEase: 0,
      fleschKincaidGradeLevel: 0,
      colemanLiauIndex: 0,
      automatedReadabilityIndex: 0,
      gunningFogIndex: 0,
      averageWordsPerSentence: 0,
      averageSyllablesPerWord: 0,
      complexWordPercentage: 0,
      academicVocabularyPercentage: 0,
      recommendedGradeLevel: 0,
      readingLevel: 'elementary',
      appropriateForLevel: false
    }
  }
  
  // Count complex and academic words
  const complexWordCount = stats.words.filter(isComplexWord).length
  const academicWordCount = stats.words.filter(word => isAcademicVocabulary(word, targetLevel)).length
  
  // Calculate readability scores
  const fleschReadingEase = calculateFleschReadingEase(stats.wordCount, stats.sentenceCount, stats.syllableCount)
  const fleschKincaidGradeLevel = calculateFleschKincaidGradeLevel(stats.wordCount, stats.sentenceCount, stats.syllableCount)
  const colemanLiauIndex = calculateColemanLiauIndex(stats.wordCount, stats.sentenceCount, stats.characterCount)
  const automatedReadabilityIndex = calculateAutomatedReadabilityIndex(stats.wordCount, stats.sentenceCount, stats.characterCount)
  const gunningFogIndex = calculateGunningFogIndex(stats.wordCount, stats.sentenceCount, complexWordCount)
  
  // Calculate averages and percentages
  const averageWordsPerSentence = stats.wordCount / stats.sentenceCount
  const averageSyllablesPerWord = stats.syllableCount / stats.wordCount
  const complexWordPercentage = (complexWordCount / stats.wordCount) * 100
  const academicVocabularyPercentage = (academicWordCount / stats.wordCount) * 100
  
  // Determine overall grade level (average of multiple metrics)
  const recommendedGradeLevel = Math.round(
    (fleschKincaidGradeLevel + colemanLiauIndex + automatedReadabilityIndex + gunningFogIndex) / 4
  )
  
  const readingLevel = getReadingLevel(recommendedGradeLevel)
  
  // Check if appropriate for target level
  const targetGradeRange = targetLevel === 'high-school' ? [9, 12] : [13, 16]
  const appropriateForLevel = recommendedGradeLevel >= targetGradeRange[0] && recommendedGradeLevel <= targetGradeRange[1]
  
  return {
    wordCount: stats.wordCount,
    sentenceCount: stats.sentenceCount,
    syllableCount: stats.syllableCount,
    characterCount: stats.characterCount,
    paragraphCount: stats.paragraphCount,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGradeLevel: Math.round(fleschKincaidGradeLevel * 10) / 10,
    colemanLiauIndex: Math.round(colemanLiauIndex * 10) / 10,
    automatedReadabilityIndex: Math.round(automatedReadabilityIndex * 10) / 10,
    gunningFogIndex: Math.round(gunningFogIndex * 10) / 10,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 100) / 100,
    complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
    academicVocabularyPercentage: Math.round(academicVocabularyPercentage * 10) / 10,
    recommendedGradeLevel,
    readingLevel,
    appropriateForLevel
  }
}

/**
 * Generate comprehensive readability assessment with feedback
 */
export function assessReadability(
  text: string,
  targetLevel: 'high-school' | 'college' = 'high-school'
): ReadabilityAssessment {
  const metrics = calculateReadabilityMetrics(text, targetLevel)
  
  if (metrics.wordCount === 0) {
    return {
      metrics,
      feedback: ['No text to analyze'],
      recommendations: ['Add content to receive readability feedback'],
      strengths: [],
      improvementAreas: []
    }
  }
  
  const feedback: string[] = []
  const recommendations: string[] = []
  const strengths: string[] = []
  const improvementAreas: string[] = []
  
  const targetGradeRange = targetLevel === 'high-school' ? [9, 12] : [13, 16]
  const targetName = targetLevel === 'high-school' ? 'high school' : 'college'
  
  // Overall readability assessment
  if (metrics.appropriateForLevel) {
    feedback.push(`✅ Your writing is at an appropriate ${targetName} level (Grade ${metrics.recommendedGradeLevel}).`)
    strengths.push(`Appropriate complexity for ${targetName} audience`)
  } else if (metrics.recommendedGradeLevel < targetGradeRange[0]) {
    feedback.push(`📈 Your writing is below ${targetName} level (Grade ${metrics.recommendedGradeLevel}). Consider using more sophisticated vocabulary and sentence structures.`)
    improvementAreas.push('Increase vocabulary sophistication')
    improvementAreas.push('Use more complex sentence structures')
    recommendations.push('Incorporate more academic vocabulary and transition words')
    recommendations.push('Vary sentence length and structure for better flow')
  } else {
    feedback.push(`📉 Your writing is above typical ${targetName} level (Grade ${metrics.recommendedGradeLevel}). Consider simplifying for better clarity.`)
    improvementAreas.push('Simplify overly complex sentences')
    recommendations.push('Break down long sentences into shorter, clearer ones')
  }
  
  // Sentence length analysis
  if (metrics.averageWordsPerSentence < 10) {
    improvementAreas.push('Sentence length too short')
    recommendations.push('Combine short sentences or add more detail to create better flow')
  } else if (metrics.averageWordsPerSentence > 25) {
    improvementAreas.push('Sentences too long')
    recommendations.push('Break up long sentences for better readability')
  } else {
    strengths.push('Good sentence length variety')
  }
  
  // Vocabulary analysis
  if (metrics.academicVocabularyPercentage < 5) {
    improvementAreas.push('Limited academic vocabulary')
    recommendations.push('Incorporate more academic terms and formal language')
  } else if (metrics.academicVocabularyPercentage > 15) {
    strengths.push('Strong use of academic vocabulary')
  } else {
    strengths.push('Good balance of academic vocabulary')
  }
  
  // Complex words analysis
  if (metrics.complexWordPercentage < 10) {
    if (targetLevel === 'college') {
      improvementAreas.push('Vocabulary could be more sophisticated')
      recommendations.push('Use more precise, advanced terminology')
    } else {
      strengths.push('Clear, accessible vocabulary')
    }
  } else if (metrics.complexWordPercentage > 20) {
    improvementAreas.push('May be overly complex')
    recommendations.push('Balance complex terms with simpler explanations')
  } else {
    strengths.push('Good balance of vocabulary complexity')
  }
  
  // Flesch Reading Ease interpretation
  if (metrics.fleschReadingEase >= 70) {
    if (targetLevel === 'high-school') {
      strengths.push('Very readable and accessible')
    } else {
      feedback.push('💡 Consider adding more complexity for college-level writing')
    }
  } else if (metrics.fleschReadingEase >= 50) {
    strengths.push('Good readability for academic writing')
  } else {
    improvementAreas.push('Text may be difficult to read')
    recommendations.push('Simplify sentence structure and word choice')
  }
  
  // Paragraph structure
  const wordsPerParagraph = metrics.wordCount / metrics.paragraphCount
  if (wordsPerParagraph < 50) {
    recommendations.push('Consider developing paragraphs with more detail and examples')
  } else if (wordsPerParagraph > 200) {
    recommendations.push('Break up long paragraphs for better organization')
  } else {
    strengths.push('Good paragraph length and organization')
  }
  
  return {
    metrics,
    feedback,
    recommendations,
    strengths,
    improvementAreas
  }
}

/**
 * Get readability score interpretation
 */
export function interpretReadabilityScore(score: number, metric: 'flesch' | 'grade-level'): string {
  if (metric === 'flesch') {
    if (score >= 90) return 'Very Easy (5th grade)'
    if (score >= 80) return 'Easy (6th grade)'
    if (score >= 70) return 'Fairly Easy (7th grade)'
    if (score >= 60) return 'Standard (8th-9th grade)'
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)'
    if (score >= 30) return 'Difficult (College level)'
    return 'Very Difficult (Graduate level)'
  } else {
    if (score <= 6) return 'Elementary School'
    if (score <= 8) return 'Middle School'
    if (score <= 12) return 'High School'
    if (score <= 16) return 'College'
    return 'Graduate School'
  }
} 