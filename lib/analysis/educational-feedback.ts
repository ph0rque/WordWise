// Educational feedback system with grammar rule explanations
// Provides comprehensive learning-focused feedback for academic writing improvement

import { GrammarRule, EducationalFeedback, EnhancedSuggestion, Suggestion } from '@/lib/types'

// Comprehensive grammar rules database for high school academic writing
const GRAMMAR_RULES: Record<string, GrammarRule> = {
  'subject-verb-agreement': {
    id: 'subject-verb-agreement',
    name: 'Subject-Verb Agreement',
    category: 'grammar',
    description: 'The subject and verb in a sentence must agree in number (singular/plural)',
    explanation: 'When the subject is singular, use a singular verb. When the subject is plural, use a plural verb. This is one of the most fundamental grammar rules in English.',
    examples: [
      {
        incorrect: 'The student are studying hard.',
        correct: 'The student is studying hard.',
        explanation: 'Singular subject "student" requires singular verb "is"'
      },
      {
        incorrect: 'The data shows interesting results.',
        correct: 'The data show interesting results.',
        explanation: '"Data" is plural, so it requires the plural verb "show"'
      },
      {
        incorrect: 'Each of the students have completed their assignment.',
        correct: 'Each of the students has completed their assignment.',
        explanation: '"Each" is singular, so it requires the singular verb "has"'
      }
    ],
    difficulty: 'beginner',
    commonMistakes: [
      'Using plural verbs with singular subjects',
      'Confusion with collective nouns',
      'Mistakes with indefinite pronouns (each, every, neither)',
      'Errors with compound subjects'
    ],
    tips: [
      'Identify the main subject, ignoring prepositional phrases',
      'Remember that "data" is plural, "datum" is singular',
      'Collective nouns (team, group, family) are usually singular',
      'Each, every, neither, either are always singular'
    ],
    relatedRules: ['pronoun-antecedent-agreement', 'collective-nouns']
  },

  'pronoun-antecedent-agreement': {
    id: 'pronoun-antecedent-agreement',
    name: 'Pronoun-Antecedent Agreement',
    category: 'grammar',
    description: 'Pronouns must agree with their antecedents in number, gender, and person',
    explanation: 'A pronoun must match the noun it replaces in number (singular/plural), gender (if applicable), and person (first, second, third).',
    examples: [
      {
        incorrect: 'Every student should bring their textbook.',
        correct: 'Every student should bring his or her textbook.',
        explanation: '"Every student" is singular, so use singular pronouns'
      },
      {
        incorrect: 'The team celebrated their victory.',
        correct: 'The team celebrated its victory.',
        explanation: '"Team" is a collective noun treated as singular'
      }
    ],
    difficulty: 'intermediate',
    commonMistakes: [
      'Using plural pronouns with singular antecedents',
      'Gender-neutral pronoun confusion',
      'Collective noun pronoun errors'
    ],
    tips: [
      'Identify the antecedent first',
      'Use "his or her" for singular gender-neutral references',
      'Collective nouns usually take singular pronouns'
    ],
    relatedRules: ['subject-verb-agreement', 'collective-nouns']
  },

  'comma-splice': {
    id: 'comma-splice',
    name: 'Comma Splice',
    category: 'punctuation',
    description: 'Two independent clauses cannot be joined with only a comma',
    explanation: 'A comma splice occurs when two complete sentences are incorrectly joined with just a comma. Use a semicolon, period, or coordinating conjunction instead.',
    examples: [
      {
        incorrect: 'The research is important, it will help many people.',
        correct: 'The research is important; it will help many people.',
        explanation: 'Use a semicolon to join related independent clauses'
      },
      {
        incorrect: 'Students studied hard, they wanted good grades.',
        correct: 'Students studied hard because they wanted good grades.',
        explanation: 'Use a subordinating conjunction to show the relationship'
      }
    ],
    difficulty: 'intermediate',
    commonMistakes: [
      'Joining complete sentences with only a comma',
      'Not recognizing independent clauses',
      'Overusing commas in compound sentences'
    ],
    tips: [
      'If you can put a period where the comma is, you likely have a comma splice',
      'Use FANBOYS (for, and, nor, but, or, yet, so) with a comma to join clauses',
      'Semicolons work well for closely related ideas'
    ],
    relatedRules: ['run-on-sentences', 'semicolon-usage']
  },

  'apostrophe-usage': {
    id: 'apostrophe-usage',
    name: 'Apostrophe Usage',
    category: 'punctuation',
    description: 'Apostrophes show possession or form contractions',
    explanation: 'Apostrophes have two main uses: to show possession (ownership) and to form contractions (shortened forms). They are NOT used to make plurals.',
    examples: [
      {
        incorrect: "The students' books are heavy.",
        correct: "The students' books are heavy.",
        explanation: 'Plural possessive: apostrophe after the s'
      },
      {
        incorrect: "Its a beautiful day.",
        correct: "It's a beautiful day.",
        explanation: '"It\'s" is a contraction for "it is"'
      },
      {
        incorrect: "The 1990's were an interesting decade.",
        correct: "The 1990s were an interesting decade.",
        explanation: 'No apostrophe needed for plural decades'
      }
    ],
    difficulty: 'beginner',
    commonMistakes: [
      'Using apostrophes for plurals',
      'Confusing "its" and "it\'s"',
      'Wrong placement in possessives'
    ],
    tips: [
      'Never use apostrophes for plurals',
      '"Its" shows possession, "it\'s" means "it is"',
      'For singular nouns: add \'s (cat\'s toy)',
      'For plural nouns ending in s: add \' (cats\' toys)'
    ],
    relatedRules: ['contractions', 'possessive-nouns']
  },

  'academic-tone': {
    id: 'academic-tone',
    name: 'Academic Tone and Formality',
    category: 'academic-style',
    description: 'Academic writing requires formal, objective tone',
    explanation: 'Academic writing should be formal, objective, and impersonal. Avoid contractions, first person (I, we), and casual language.',
    examples: [
      {
        incorrect: "I think this research is really important.",
        correct: "This research appears to be significant.",
        explanation: 'Use objective language instead of personal opinions'
      },
      {
        incorrect: "The results don't show any correlation.",
        correct: "The results do not show any correlation.",
        explanation: 'Avoid contractions in formal writing'
      },
      {
        incorrect: "This study is awesome and shows cool findings.",
        correct: "This study demonstrates compelling findings.",
        explanation: 'Use precise, formal vocabulary'
      }
    ],
    difficulty: 'intermediate',
    commonMistakes: [
      'Using first person pronouns',
      'Including contractions',
      'Using informal vocabulary',
      'Expressing personal opinions as facts'
    ],
    tips: [
      'Use third person perspective',
      'Write out contractions fully',
      'Choose precise, formal vocabulary',
      'Present evidence objectively'
    ],
    relatedRules: ['word-choice', 'objective-writing']
  },

  'parallel-structure': {
    id: 'parallel-structure',
    name: 'Parallel Structure',
    category: 'style',
    description: 'Items in a series should have the same grammatical form',
    explanation: 'When listing items or ideas, use the same grammatical structure for each element. This creates clarity and rhythm in your writing.',
    examples: [
      {
        incorrect: 'Students should read carefully, take notes, and studying regularly.',
        correct: 'Students should read carefully, take notes, and study regularly.',
        explanation: 'All verbs should be in the same form: read, take, study'
      },
      {
        incorrect: 'The research was thorough, innovative, and showing great promise.',
        correct: 'The research was thorough, innovative, and promising.',
        explanation: 'All adjectives should be in the same form'
      }
    ],
    difficulty: 'intermediate',
    commonMistakes: [
      'Mixing verb forms in series',
      'Inconsistent adjective forms',
      'Breaking parallel structure with conjunctions'
    ],
    tips: [
      'Make sure all items in a list have the same grammatical form',
      'Check verb tenses and forms carefully',
      'Read your list aloud to hear inconsistencies'
    ],
    relatedRules: ['series-commas', 'coordination']
  },

  'word-choice': {
    id: 'word-choice',
    name: 'Academic Word Choice',
    category: 'vocabulary',
    description: 'Choose precise, appropriate vocabulary for academic writing',
    explanation: 'Academic writing requires specific, precise vocabulary. Avoid vague words, slang, and overly casual language.',
    examples: [
      {
        incorrect: 'The study looked at how students learn.',
        correct: 'The study examined how students learn.',
        explanation: '"Examined" is more precise than "looked at"'
      },
      {
        incorrect: 'This thing is really important for understanding the topic.',
        correct: 'This concept is crucial for understanding the topic.',
        explanation: 'Use specific nouns and strong adjectives'
      }
    ],
    difficulty: 'intermediate',
    commonMistakes: [
      'Using vague words like "thing," "stuff," "a lot"',
      'Overusing "really," "very," "quite"',
      'Using informal expressions'
    ],
    tips: [
      'Replace vague words with specific terms',
      'Use strong verbs instead of weak verb + adverb combinations',
      'Choose words that convey precise meaning'
    ],
    relatedRules: ['academic-tone', 'conciseness']
  },

  'thesis-statement': {
    id: 'thesis-statement',
    name: 'Thesis Statement Construction',
    category: 'academic-style',
    description: 'A thesis statement presents the main argument clearly and specifically',
    explanation: 'A strong thesis statement makes a specific, arguable claim that can be supported with evidence. It should appear early in your essay and guide the entire argument.',
    examples: [
      {
        incorrect: 'Climate change is bad.',
        correct: 'Climate change poses significant threats to coastal communities through rising sea levels and increased storm intensity.',
        explanation: 'Specific, arguable claim with clear supporting points'
      },
      {
        incorrect: 'This essay will discuss social media.',
        correct: 'Social media platforms have fundamentally altered interpersonal communication by reducing face-to-face interaction and creating new forms of social anxiety.',
        explanation: 'Makes a specific argument rather than just announcing the topic'
      }
    ],
    difficulty: 'advanced',
    commonMistakes: [
      'Making statements that are too broad',
      'Presenting facts instead of arguments',
      'Using announcement phrases',
      'Being too vague or general'
    ],
    tips: [
      'Make a specific, arguable claim',
      'Avoid announcement phrases like "This essay will..."',
      'Ensure your thesis can be supported with evidence',
      'Place your thesis early in the introduction'
    ],
    relatedRules: ['argument-structure', 'topic-sentences']
  },

  'citation-integration': {
    id: 'citation-integration',
    name: 'Citation Integration',
    category: 'academic-style',
    description: 'Smoothly integrate sources into your writing with proper attribution',
    explanation: 'Citations should be integrated smoothly into your text, not just dropped in. Introduce sources and explain their relevance to your argument.',
    examples: [
      {
        incorrect: 'Climate change is real. "Global temperatures have risen by 1.1°C since 1880" (NASA, 2023).',
        correct: 'According to NASA (2023), global temperatures have risen by 1.1°C since 1880, providing clear evidence of climate change.',
        explanation: 'Integrate the citation smoothly with an introductory phrase'
      },
      {
        incorrect: 'Smith (2022) says that education is important.',
        correct: 'Smith (2022) argues that educational investment directly correlates with economic growth in developing nations.',
        explanation: 'Use precise verbs and include specific information'
      }
    ],
    difficulty: 'advanced',
    commonMistakes: [
      'Dropping quotes without introduction',
      'Not explaining the relevance of citations',
      'Using weak introduction verbs like "says"',
      'Over-relying on direct quotes'
    ],
    tips: [
      'Introduce sources with strong verbs (argues, demonstrates, reveals)',
      'Explain how each source supports your argument',
      'Paraphrase more than you quote directly',
      'Use signal phrases to introduce citations'
    ],
    relatedRules: ['paraphrasing', 'academic-tone']
  }
}

// Common mistake patterns for educational feedback
const MISTAKE_PATTERNS = {
  'informal-language': {
    patterns: ['really', 'very', 'a lot', 'stuff', 'things', 'good', 'bad', 'big', 'small'],
    category: 'academic-style',
    ruleId: 'word-choice'
  },
  'first-person': {
    patterns: ['I think', 'I believe', 'I feel', 'we can see', 'in my opinion'],
    category: 'academic-style',
    ruleId: 'academic-tone'
  },
  'contractions': {
    patterns: ["don't", "can't", "won't", "isn't", "aren't", "it's", "they're"],
    category: 'academic-style',
    ruleId: 'academic-tone'
  },
  'vague-words': {
    patterns: ['thing', 'stuff', 'something', 'someone', 'somewhere'],
    category: 'vocabulary',
    ruleId: 'word-choice'
  },
  'weak-verbs': {
    patterns: ['is', 'are', 'was', 'were', 'have', 'has', 'get', 'got', 'make', 'do'],
    category: 'style',
    ruleId: 'word-choice'
  }
}

/**
 * Get grammar rule by ID
 */
export function getGrammarRule(ruleId: string): GrammarRule | null {
  return GRAMMAR_RULES[ruleId] || null
}

/**
 * Get all grammar rules for a specific category
 */
export function getGrammarRulesByCategory(category: GrammarRule['category']): GrammarRule[] {
  return Object.values(GRAMMAR_RULES).filter(rule => rule.category === category)
}

/**
 * Get grammar rules by difficulty level
 */
export function getGrammarRulesByDifficulty(difficulty: GrammarRule['difficulty']): GrammarRule[] {
  return Object.values(GRAMMAR_RULES).filter(rule => rule.difficulty === difficulty)
}

/**
 * Identify mistake patterns in text
 */
export function identifyMistakePatterns(text: string): Array<{
  pattern: string
  category: string
  ruleId: string
  positions: Array<{ start: number; end: number }>
}> {
  const mistakes: Array<{
    pattern: string
    category: string
    ruleId: string
    positions: Array<{ start: number; end: number }>
  }> = []

  Object.entries(MISTAKE_PATTERNS).forEach(([patternType, config]) => {
    config.patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi')
      let match
      const positions: Array<{ start: number; end: number }> = []

      while ((match = regex.exec(text)) !== null) {
        positions.push({
          start: match.index,
          end: match.index + match[0].length
        })
      }

      if (positions.length > 0) {
        mistakes.push({
          pattern,
          category: config.category,
          ruleId: config.ruleId,
          positions
        })
      }
    })
  })

  return mistakes
}

/**
 * Create educational feedback for a grammar rule
 */
export function createEducationalFeedback(
  ruleId: string,
  context: string,
  mistakeType?: string
): EducationalFeedback | null {
  const rule = getGrammarRule(ruleId)
  if (!rule) return null

  const learningObjectives: Record<string, string> = {
    'subject-verb-agreement': 'Master the fundamental rule of matching subjects and verbs in number',
    'pronoun-antecedent-agreement': 'Learn to match pronouns with their antecedents correctly',
    'comma-splice': 'Understand how to properly join independent clauses',
    'apostrophe-usage': 'Master the correct use of apostrophes for possession and contractions',
    'academic-tone': 'Develop formal, objective writing style appropriate for academic contexts',
    'parallel-structure': 'Create balanced, rhythmic sentences with consistent grammatical forms',
    'word-choice': 'Select precise, appropriate vocabulary for academic writing',
    'thesis-statement': 'Craft clear, arguable thesis statements that guide your essay',
    'citation-integration': 'Smoothly incorporate sources into your academic writing'
  }

  const practiceExercises: Record<string, { instruction: string; examples: string[] }> = {
    'subject-verb-agreement': {
      instruction: 'Identify the subject and choose the correct verb form:',
      examples: [
        'The group of students (is/are) working on their project.',
        'Each of the researchers (has/have) contributed to the study.',
        'The data (shows/show) a clear trend.'
      ]
    },
    'academic-tone': {
      instruction: 'Rewrite these sentences to use formal, academic tone:',
      examples: [
        'I think this study is really important.',
        "The results don't show what we expected.",
        'This research is awesome and proves our point.'
      ]
    },
    'word-choice': {
      instruction: 'Replace the vague words with more precise alternatives:',
      examples: [
        'The study looked at how students learn.',
        'This thing is really important for the topic.',
        'The results show that stuff happens when you do this.'
      ]
    }
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    explanation: rule.explanation,
    examples: rule.examples,
    tips: rule.tips,
    difficulty: rule.difficulty,
    learningObjective: learningObjectives[ruleId] || `Learn to apply ${rule.name} correctly`,
    practiceExercise: practiceExercises[ruleId]
  }
}

/**
 * Enhance suggestions with educational feedback
 */
export function enhanceSuggestionsWithEducation(
  suggestions: Suggestion[],
  text: string
): EnhancedSuggestion[] {
  const mistakes = identifyMistakePatterns(text)
  const mistakeMap = new Map<string, typeof mistakes[0]>()
  
  mistakes.forEach(mistake => {
    mistake.positions.forEach(pos => {
      const key = `${pos.start}-${pos.end}`
      mistakeMap.set(key, mistake)
    })
  })

  return suggestions.map(suggestion => {
    const enhanced: EnhancedSuggestion = {
      ...suggestion,
      learningValue: 'medium'
    }

    // Check if this suggestion matches a known mistake pattern
    const suggestionLength = suggestion.originalText.length
    const suggestionKey = `${suggestion.position}-${suggestion.position + suggestionLength}`
    const matchedMistake = mistakeMap.get(suggestionKey)

    if (matchedMistake) {
      enhanced.educationalFeedback = createEducationalFeedback(
        matchedMistake.ruleId,
        text.substring(Math.max(0, suggestion.position - 20), Math.min(text.length, suggestion.position + suggestionLength + 20)),
        matchedMistake.pattern
      ) || undefined
      enhanced.grammarRule = matchedMistake.ruleId
      enhanced.learningValue = 'high'
      enhanced.mistakePattern = matchedMistake.pattern
    }

    // Determine learning value based on suggestion type
    if (suggestion.type === 'grammar' || suggestion.type === 'academic-style') {
      enhanced.learningValue = 'high'
    } else if (suggestion.type === 'vocabulary' || suggestion.type === 'style') {
      enhanced.learningValue = 'medium'
    } else {
      enhanced.learningValue = 'low'
    }

    // Add improvement tips based on suggestion type
    const improvementTips: Record<string, string> = {
      'grammar': 'Focus on understanding the underlying grammar rule to avoid similar mistakes',
      'academic-style': 'Practice using formal, academic language in your writing',
      'vocabulary': 'Build your academic vocabulary by reading scholarly articles',
      'style': 'Pay attention to sentence structure and flow',
      'spelling': 'Use spell-check tools and proofread carefully',
      'punctuation': 'Review punctuation rules and practice applying them'
    }

    enhanced.improvementTip = improvementTips[suggestion.type] || 'Continue practicing to improve your writing skills'

    return enhanced
  })
}

/**
 * Generate comprehensive educational report
 */
export function generateEducationalReport(
  suggestions: EnhancedSuggestion[],
  text: string
): {
  overallAssessment: string
  keyLearningAreas: string[]
  priorityRules: GrammarRule[]
  practiceRecommendations: string[]
  progressIndicators: {
    strengthAreas: string[]
    improvementNeeded: string[]
    nextSteps: string[]
  }
} {
  const ruleFrequency = new Map<string, number>()
  const categoryFrequency = new Map<string, number>()
  
  suggestions.forEach(suggestion => {
    if (suggestion.grammarRule) {
      ruleFrequency.set(suggestion.grammarRule, (ruleFrequency.get(suggestion.grammarRule) || 0) + 1)
    }
    if (suggestion.educationalFeedback) {
      const category = suggestion.educationalFeedback.category
      categoryFrequency.set(category, (categoryFrequency.get(category) || 0) + 1)
    }
  })

  // Identify priority rules (most frequent issues)
  const priorityRules = Array.from(ruleFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([ruleId]) => getGrammarRule(ruleId))
    .filter((rule): rule is GrammarRule => rule !== null)

  // Generate assessment
  const totalSuggestions = suggestions.length
  const highValueSuggestions = suggestions.filter(s => s.learningValue === 'high').length
  
  let overallAssessment = ''
  if (totalSuggestions === 0) {
    overallAssessment = 'Excellent work! Your writing demonstrates strong command of grammar and academic style.'
  } else if (highValueSuggestions / totalSuggestions > 0.7) {
    overallAssessment = 'Your writing shows good potential, but focus on fundamental grammar and academic style rules to improve significantly.'
  } else if (highValueSuggestions / totalSuggestions > 0.4) {
    overallAssessment = 'Good foundation with some areas for improvement. Focus on consistency in applying grammar rules.'
  } else {
    overallAssessment = 'Strong writing with minor areas for refinement. Continue practicing advanced academic writing techniques.'
  }

  // Key learning areas
  const keyLearningAreas = Array.from(categoryFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category)

  // Practice recommendations
  const practiceRecommendations = [
    'Review and practice the grammar rules that appear most frequently in your writing',
    'Read academic articles in your field to observe proper academic style',
    'Practice writing thesis statements and topic sentences',
    'Work on integrating sources smoothly into your arguments',
    'Focus on using precise, academic vocabulary'
  ]

  // Progress indicators
  const strengthAreas: string[] = []
  const improvementNeeded: string[] = []
  const nextSteps: string[] = []

  if (categoryFrequency.get('punctuation') === 0) {
    strengthAreas.push('Strong punctuation skills')
  } else if ((categoryFrequency.get('punctuation') || 0) > 2) {
    improvementNeeded.push('Punctuation accuracy')
    nextSteps.push('Review basic punctuation rules and practice applying them')
  }

  if (categoryFrequency.get('academic-style') === 0) {
    strengthAreas.push('Good academic tone and formality')
  } else if ((categoryFrequency.get('academic-style') || 0) > 2) {
    improvementNeeded.push('Academic writing style')
    nextSteps.push('Practice formal, objective writing without personal opinions')
  }

  if (categoryFrequency.get('grammar') === 0) {
    strengthAreas.push('Solid grammar foundation')
  } else if ((categoryFrequency.get('grammar') || 0) > 2) {
    improvementNeeded.push('Grammar accuracy')
    nextSteps.push('Focus on subject-verb agreement and pronoun usage')
  }

  if (strengthAreas.length === 0) {
    strengthAreas.push('Showing improvement in multiple areas')
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Continue practicing advanced academic writing techniques')
  }

  return {
    overallAssessment,
    keyLearningAreas,
    priorityRules,
    practiceRecommendations,
    progressIndicators: {
      strengthAreas,
      improvementNeeded,
      nextSteps
    }
  }
}

/**
 * Get all available grammar rules
 */
export function getAllGrammarRules(): GrammarRule[] {
  return Object.values(GRAMMAR_RULES)
}

/**
 * Search grammar rules by keyword
 */
export function searchGrammarRules(keyword: string): GrammarRule[] {
  const searchTerm = keyword.toLowerCase()
  return Object.values(GRAMMAR_RULES).filter(rule =>
    rule.name.toLowerCase().includes(searchTerm) ||
    rule.description.toLowerCase().includes(searchTerm) ||
    rule.explanation.toLowerCase().includes(searchTerm) ||
    rule.commonMistakes.some(mistake => mistake.toLowerCase().includes(searchTerm))
  )
} 