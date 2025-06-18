// Vocabulary enhancement engine for academic writing
// Provides suggestions for improving word choice and academic vocabulary usage

export interface VocabularySuggestion {
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

export interface VocabularyAnalysis {
  totalWords: number
  uniqueWords: number
  academicWords: number
  informalWords: number
  repetitiveWords: string[]
  vocabularyDiversity: number // 0-100 scale
  academicLevel: 'elementary' | 'middle-school' | 'high-school' | 'college'
  suggestions: VocabularySuggestion[]
}

export interface VocabularyEnhancement {
  analysis: VocabularyAnalysis
  overallScore: number // 0-100
  strengths: string[]
  improvementAreas: string[]
  recommendations: string[]
}

// Academic word lists by level
const ACADEMIC_VOCABULARY_LISTS = {
  elementary: [
    'important', 'different', 'example', 'problem', 'answer', 'question',
    'because', 'reason', 'result', 'change', 'compare', 'explain'
  ],
  middleSchool: [
    'analyze', 'describe', 'identify', 'compare', 'contrast', 'evaluate',
    'significant', 'evidence', 'conclusion', 'process', 'method', 'factor'
  ],
  highSchool: [
    'synthesize', 'demonstrate', 'establish', 'investigate', 'examine', 'illustrate',
    'interpret', 'justify', 'furthermore', 'moreover', 'consequently', 'therefore',
    'nevertheless', 'however', 'substantial', 'comprehensive', 'extensive', 'crucial'
  ],
  college: [
    'paradigm', 'methodology', 'hypothesis', 'theoretical', 'empirical', 'substantiate',
    'corroborate', 'extrapolate', 'juxtapose', 'dichotomy', 'synthesis', 'discourse',
    'epistemology', 'ontology', 'phenomenology', 'hermeneutics', 'dialectical'
  ]
}

// Informal words to academic replacements
const INFORMAL_TO_ACADEMIC = {
  'really': ['significantly', 'considerably', 'substantially'],
  'very': ['extremely', 'particularly', 'notably'],
  'big': ['substantial', 'significant', 'considerable'],
  'small': ['minimal', 'limited', 'modest'],
  'good': ['effective', 'beneficial', 'advantageous'],
  'bad': ['detrimental', 'problematic', 'adverse'],
  'a lot': ['numerous', 'substantial', 'considerable'],
  'lots of': ['numerous', 'multiple', 'various'],
  'thing': ['element', 'aspect', 'component'],
  'stuff': ['material', 'content', 'elements'],
  'get': ['obtain', 'acquire', 'achieve'],
  'make': ['create', 'establish', 'generate'],
  'show': ['demonstrate', 'illustrate', 'reveal'],
  'tell': ['indicate', 'suggest', 'convey'],
  'go': ['proceed', 'advance', 'progress'],
  'come': ['emerge', 'arise', 'develop'],
  'put': ['place', 'position', 'establish'],
  'take': ['adopt', 'utilize', 'implement'],
  'use': ['utilize', 'employ', 'implement'],
  'help': ['assist', 'facilitate', 'support'],
  'try': ['attempt', 'endeavor', 'strive'],
  'want': ['desire', 'seek', 'require'],
  'need': ['require', 'necessitate', 'demand'],
  'think': ['believe', 'consider', 'maintain'],
  'know': ['understand', 'recognize', 'acknowledge'],
  'see': ['observe', 'perceive', 'recognize'],
  'find': ['discover', 'identify', 'determine'],
  'look': ['examine', 'investigate', 'analyze'],
  'work': ['function', 'operate', 'perform'],
  'start': ['begin', 'initiate', 'commence'],
  'end': ['conclude', 'terminate', 'finalize'],
  'keep': ['maintain', 'preserve', 'retain'],
  'give': ['provide', 'offer', 'present'],
  'talk': ['discuss', 'communicate', 'converse'],
  'say': ['state', 'declare', 'assert'],
  'ask': ['inquire', 'request', 'question']
}

// Common overused words that need variety
const OVERUSED_WORDS = [
  'the', 'and', 'that', 'this', 'it', 'is', 'was', 'are', 'were',
  'said', 'then', 'also', 'but', 'so', 'just', 'very', 'really'
]

// Transition words by category
const TRANSITION_WORDS = {
  addition: ['furthermore', 'moreover', 'additionally', 'in addition', 'also'],
  contrast: ['however', 'nevertheless', 'conversely', 'on the other hand', 'whereas'],
  cause: ['therefore', 'consequently', 'thus', 'as a result', 'hence'],
  sequence: ['first', 'second', 'subsequently', 'finally', 'ultimately'],
  emphasis: ['indeed', 'certainly', 'undoubtedly', 'notably', 'particularly'],
  example: ['for instance', 'specifically', 'namely', 'in particular', 'such as']
}

/**
 * Tokenize text into words with position information
 */
function tokenizeWithPositions(text: string): Array<{word: string, start: number, end: number}> {
  const tokens: Array<{word: string, start: number, end: number}> = []
  const wordRegex = /\b\w+\b/g
  let match
  
  while ((match = wordRegex.exec(text)) !== null) {
    tokens.push({
      word: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return tokens
}

/**
 * Check if a word is academic vocabulary
 */
function isAcademicWord(word: string, level: 'elementary' | 'middle-school' | 'high-school' | 'college' = 'high-school'): boolean {
  const lowerWord = word.toLowerCase()
  
  switch (level) {
    case 'elementary':
      return ACADEMIC_VOCABULARY_LISTS.elementary.includes(lowerWord)
    case 'middle-school':
      return ACADEMIC_VOCABULARY_LISTS.elementary.includes(lowerWord) ||
             ACADEMIC_VOCABULARY_LISTS.middleSchool.includes(lowerWord)
    case 'high-school':
      return ACADEMIC_VOCABULARY_LISTS.elementary.includes(lowerWord) ||
             ACADEMIC_VOCABULARY_LISTS.middleSchool.includes(lowerWord) ||
             ACADEMIC_VOCABULARY_LISTS.highSchool.includes(lowerWord)
    case 'college':
      return Object.values(ACADEMIC_VOCABULARY_LISTS).some(list => list.includes(lowerWord))
    default:
      return false
  }
}

/**
 * Check if a word is informal and needs academic replacement
 */
function isInformalWord(word: string): boolean {
  return Object.keys(INFORMAL_TO_ACADEMIC).includes(word.toLowerCase())
}

/**
 * Get academic alternatives for a word
 */
function getAcademicAlternatives(word: string): string[] {
  const lowerWord = word.toLowerCase()
  return (INFORMAL_TO_ACADEMIC as Record<string, string[]>)[lowerWord] || []
}

/**
 * Calculate vocabulary diversity (Type-Token Ratio)
 */
function calculateVocabularyDiversity(words: string[]): number {
  if (words.length === 0) return 0
  
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const typeTokenRatio = uniqueWords.size / words.length
  
  // Convert to 0-100 scale, with adjustments for text length
  let diversityScore = typeTokenRatio * 100
  
  // Adjust for text length (longer texts naturally have lower TTR)
  if (words.length > 100) {
    diversityScore *= 1.2 // Bonus for maintaining diversity in longer texts
  }
  
  return Math.min(100, Math.round(diversityScore))
}

/**
 * Determine academic level based on vocabulary usage
 */
function determineAcademicLevel(words: string[]): 'elementary' | 'middle-school' | 'high-school' | 'college' {
  const totalWords = words.length
  if (totalWords === 0) return 'elementary'
  
  const elementaryCount = words.filter(w => isAcademicWord(w, 'elementary')).length
  const middleSchoolCount = words.filter(w => isAcademicWord(w, 'middle-school')).length
  const highSchoolCount = words.filter(w => isAcademicWord(w, 'high-school')).length
  const collegeCount = words.filter(w => isAcademicWord(w, 'college')).length
  
  const elementaryPercent = (elementaryCount / totalWords) * 100
  const middleSchoolPercent = (middleSchoolCount / totalWords) * 100
  const highSchoolPercent = (highSchoolCount / totalWords) * 100
  const collegePercent = (collegeCount / totalWords) * 100
  
  if (collegePercent > 5) return 'college'
  if (highSchoolPercent > 8) return 'high-school'
  if (middleSchoolPercent > 5) return 'middle-school'
  return 'elementary'
}

/**
 * Find repetitive words that need variety
 */
function findRepetitiveWords(words: string[]): string[] {
  const wordCounts: Record<string, number> = {}
  const totalWords = words.length
  
  // Count word frequencies
  words.forEach(word => {
    const lowerWord = word.toLowerCase()
    if (!OVERUSED_WORDS.includes(lowerWord) && lowerWord.length > 3) {
      wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1
    }
  })
  
  // Find words used too frequently (more than 2% of total words, minimum 3 times)
  const repetitiveWords: string[] = []
  const threshold = Math.max(3, Math.ceil(totalWords * 0.02))
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    if (count >= threshold) {
      repetitiveWords.push(word)
    }
  })
  
  return repetitiveWords
}

/**
 * Generate vocabulary suggestions for text
 */
function generateVocabularySuggestions(
  text: string,
  targetLevel: 'high-school' | 'college' = 'high-school'
): VocabularySuggestion[] {
  const tokens = tokenizeWithPositions(text)
  const suggestions: VocabularySuggestion[] = []
  
  tokens.forEach(token => {
    const { word, start, end } = token
    
    // Check for informal words that need academic upgrade
    if (isInformalWord(word)) {
      const alternatives = getAcademicAlternatives(word)
      if (alternatives.length > 0) {
        suggestions.push({
          originalWord: word,
          suggestions: alternatives,
          context: text.substring(Math.max(0, start - 20), Math.min(text.length, end + 20)),
          reason: 'academic-upgrade',
          priority: 'high',
          explanation: `Replace "${word}" with more academic vocabulary to improve formality and precision.`,
          position: { start, end }
        })
      }
    }
    
    // Check for opportunities to use more sophisticated vocabulary
    if (!isAcademicWord(word, targetLevel) && word.length > 3) {
      // Suggest more sophisticated alternatives for common words
      const academicAlternatives = getAcademicAlternatives(word)
      if (academicAlternatives.length > 0) {
        suggestions.push({
          originalWord: word,
          suggestions: academicAlternatives,
          context: text.substring(Math.max(0, start - 20), Math.min(text.length, end + 20)),
          reason: 'precision',
          priority: 'medium',
          explanation: `Consider using more precise academic vocabulary instead of "${word}".`,
          position: { start, end }
        })
      }
    }
  })
  
  // Sort suggestions by priority and position
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.position.start - b.position.start
  })
  
  // Limit to top 10 suggestions to avoid overwhelming the user
  return suggestions.slice(0, 10)
}

/**
 * Analyze vocabulary usage in text
 */
export function analyzeVocabulary(
  text: string,
  targetLevel: 'high-school' | 'college' = 'high-school'
): VocabularyAnalysis {
  if (!text.trim()) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      academicWords: 0,
      informalWords: 0,
      repetitiveWords: [],
      vocabularyDiversity: 0,
      academicLevel: 'elementary',
      suggestions: []
    }
  }
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const uniqueWords = new Set(words)
  const academicWords = words.filter(word => isAcademicWord(word, targetLevel))
  const informalWords = words.filter(word => isInformalWord(word))
  const repetitiveWords = findRepetitiveWords(words)
  const vocabularyDiversity = calculateVocabularyDiversity(words)
  const academicLevel = determineAcademicLevel(words)
  const suggestions = generateVocabularySuggestions(text, targetLevel)
  
  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    academicWords: academicWords.length,
    informalWords: informalWords.length,
    repetitiveWords,
    vocabularyDiversity,
    academicLevel,
    suggestions
  }
}

/**
 * Provide comprehensive vocabulary enhancement feedback
 */
export function enhanceVocabulary(
  text: string,
  targetLevel: 'high-school' | 'college' = 'high-school'
): VocabularyEnhancement {
  const analysis = analyzeVocabulary(text, targetLevel)
  
  if (analysis.totalWords === 0) {
    return {
      analysis,
      overallScore: 0,
      strengths: [],
      improvementAreas: ['Add content to receive vocabulary feedback'],
      recommendations: ['Write some text to get vocabulary enhancement suggestions']
    }
  }
  
  const strengths: string[] = []
  const improvementAreas: string[] = []
  const recommendations: string[] = []
  
  // Calculate overall score (0-100)
  let score = 50 // Base score
  
  // Academic vocabulary usage
  const academicPercentage = (analysis.academicWords / analysis.totalWords) * 100
  if (academicPercentage > 15) {
    score += 20
    strengths.push('Strong use of academic vocabulary')
  } else if (academicPercentage > 8) {
    score += 10
    strengths.push('Good use of academic vocabulary')
  } else {
    score -= 10
    improvementAreas.push('Limited academic vocabulary usage')
    recommendations.push('Incorporate more academic terms and formal language')
  }
  
  // Vocabulary diversity
  if (analysis.vocabularyDiversity > 70) {
    score += 15
    strengths.push('Excellent vocabulary diversity')
  } else if (analysis.vocabularyDiversity > 50) {
    score += 5
    strengths.push('Good vocabulary variety')
  } else {
    score -= 10
    improvementAreas.push('Limited vocabulary variety')
    recommendations.push('Use more varied vocabulary to avoid repetition')
  }
  
  // Informal word usage
  const informalPercentage = (analysis.informalWords / analysis.totalWords) * 100
  if (informalPercentage > 5) {
    score -= 15
    improvementAreas.push('Too many informal words')
    recommendations.push('Replace informal words with academic alternatives')
  } else if (informalPercentage > 2) {
    score -= 5
    improvementAreas.push('Some informal language present')
  } else {
    score += 5
    strengths.push('Appropriate formality level')
  }
  
  // Repetitive words
  if (analysis.repetitiveWords.length > 3) {
    score -= 10
    improvementAreas.push('Repetitive word usage')
    recommendations.push(`Vary your use of: ${analysis.repetitiveWords.slice(0, 3).join(', ')}`)
  } else if (analysis.repetitiveWords.length > 0) {
    score -= 5
    recommendations.push('Consider synonyms for repeated words')
  } else {
    strengths.push('Good word variety')
  }
  
  // Academic level appropriateness
  const targetLevelMap = { 'high-school': 'high-school', 'college': 'college' }
  if (analysis.academicLevel === targetLevelMap[targetLevel]) {
    score += 10
    strengths.push(`Vocabulary appropriate for ${targetLevel} level`)
  } else if (analysis.academicLevel < targetLevelMap[targetLevel]) {
    score -= 10
    improvementAreas.push(`Vocabulary below ${targetLevel} level`)
    recommendations.push('Use more sophisticated academic vocabulary')
  } else {
    improvementAreas.push('Vocabulary may be too advanced')
    recommendations.push('Balance complex terms with clearer explanations')
  }
  
  // Suggestions quality
  const highPrioritySuggestions = analysis.suggestions.filter(s => s.priority === 'high').length
  if (highPrioritySuggestions > 5) {
    score -= 10
    recommendations.push('Focus on high-priority vocabulary improvements first')
  }
  
  // Ensure score is within bounds
  const overallScore = Math.max(0, Math.min(100, Math.round(score)))
  
  // Add general recommendations based on target level
  if (targetLevel === 'high-school') {
    recommendations.push('Use transition words to connect ideas clearly')
    recommendations.push('Replace simple words with more academic alternatives')
  } else {
    recommendations.push('Incorporate discipline-specific terminology')
    recommendations.push('Use precise, technical vocabulary when appropriate')
  }
  
  return {
    analysis,
    overallScore,
    strengths,
    improvementAreas,
    recommendations
  }
}

/**
 * Get suggested transition words for better flow
 */
export function suggestTransitionWords(context: 'addition' | 'contrast' | 'cause' | 'sequence' | 'emphasis' | 'example'): string[] {
  return TRANSITION_WORDS[context] || []
}

/**
 * Get academic word suggestions for a specific level
 */
export function getAcademicWordSuggestions(level: 'elementary' | 'middle-school' | 'high-school' | 'college'): string[] {
  switch (level) {
    case 'elementary':
      return ACADEMIC_VOCABULARY_LISTS.elementary
    case 'middle-school':
      return ACADEMIC_VOCABULARY_LISTS.middleSchool
    case 'high-school':
      return ACADEMIC_VOCABULARY_LISTS.highSchool
    case 'college':
      return ACADEMIC_VOCABULARY_LISTS.college
    default:
      return []
  }
} 