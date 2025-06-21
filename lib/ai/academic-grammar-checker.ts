import type { Suggestion } from "../types"

// Academic writing vocabulary and patterns
const ACADEMIC_VOCABULARY = {
  transitions: [
    "furthermore", "moreover", "consequently", "therefore", "nevertheless", 
    "however", "in contrast", "similarly", "additionally", "subsequently"
  ],
  academicWords: [
    "analyze", "synthesize", "evaluate", "demonstrate", "establish", 
    "investigate", "examine", "illustrate", "interpret", "justify"
  ],
  formalConnectors: [
    "in addition to", "as a result of", "in spite of", "with regard to",
    "in accordance with", "due to the fact that", "for the purpose of"
  ]
}

// Academic writing style patterns to avoid
const INFORMAL_PATTERNS = [
  { pattern: /\b(gonna|wanna|gotta)\b/gi, formal: ["going to", "want to", "have to"] },
  { pattern: /\b(can't|won't|don't|isn't|aren't)\b/gi, formal: "expand contractions" },
  { pattern: /\b(really|very|pretty|quite)\s+/gi, formal: "use precise adjectives" },
  { pattern: /\b(stuff|things|guys)\b/gi, formal: ["materials", "elements", "individuals"] }
]

// Check if OpenAI is available on the server
export function isOpenAIAvailable(): boolean {
  const hasKey = !!process.env.OPENAI_API_KEY
  console.log("OpenAI API key check (academic checker):", hasKey ? "Available" : "Not available")
  return hasKey
}

// Enhanced academic grammar checking with confidence scoring
export async function checkAcademicGrammar(
  text: string,
  academicLevel: 'high-school' | 'college' = 'high-school',
  subject?: string
): Promise<Suggestion[]> {
  if (!text.trim() || text.length < 10) {
    return []
  }

  // Check if OpenAI is available first
  if (!isOpenAIAvailable()) {
    console.log("OpenAI API key not found, falling back to basic academic checker")
    return checkBasicAcademicGrammar(text)
  }

  try {
    const { createOpenAI } = await import("@ai-sdk/openai")
    const { generateObject } = await import("ai")
    const { z } = await import("zod")

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("API key not found after availability check")
    }

    const openai = createOpenAI({
      apiKey: apiKey,
    })

    // Enhanced schema with confidence scoring and academic context
    const AcademicSuggestionSchema = z.object({
      suggestions: z.array(
        z.object({
          type: z.enum(["grammar", "spelling", "style", "clarity", "tone", "academic-style", "vocabulary"]),
          position: z.number(),
          originalText: z.string(),
          suggestedText: z.string(),
          explanation: z.string(),
          severity: z.enum(["low", "medium", "high"]),
          confidence: z.number().min(0).max(100),
          academicContext: z.string().optional(),
          grammarRule: z.string().optional(),
        }),
      ),
    })

    console.log("Calling OpenAI API for academic grammar check")

    const subjectContext = subject ? `This is for a ${subject} assignment. ` : ""
    const levelContext = academicLevel === 'high-school' 
      ? "This is high school level academic writing. " 
      : "This is college level academic writing. "

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AcademicSuggestionSchema,
      prompt: `
        You are an expert spelling and grammar checker specializing in ${academicLevel} level writing.
        ${subjectContext}${levelContext}
        
        Analyze the following text with PRIORITY FOCUS on the MOST RECENT CONTENT (typically the last 10-15 words), then check the entire text for:
        
        1. SPELLING ERRORS (highest priority):
           - Misspelled words
           - Incorrect word forms
           - Typos and character transpositions
           - Homophones used incorrectly (their/there/they're, your/you're, etc.)
           - Common spelling mistakes
        
        2. GRAMMAR ERRORS (high priority):
           - Subject-verb agreement errors
           - Verb tense inconsistencies and incorrect forms
           - Pronoun-antecedent agreement
           - Sentence fragments and run-on sentences
           - Comma splices and semicolon misuse
           - Apostrophe errors (possessive vs. plural)
           - Parallel structure violations
           - Dangling and misplaced modifiers
           - Incorrect preposition usage
           - Article errors (a, an, the)
           - Comparative and superlative form errors
           - Double negatives
        
        For each error found:
        - Provide exact character position where error starts (0-based index)
        - Give the correct spelling or grammar form
        - Briefly explain the error type
        - Rate confidence (0-100%) in your correction
        
        SPECIAL INSTRUCTIONS FOR INCREMENTAL CHECKING:
        - If this appears to be a fragment (last few words), focus heavily on spelling and basic grammar
        - For recently typed content, prioritize immediate errors over style suggestions
        - Be especially careful with character positions - they must be precise
        - Focus on errors that are clear and unambiguous
        
        Text to analyze:
        "${text}"
        
        Return only clear spelling and grammar errors, ordered by confidence and severity.
      `,
    })

    console.log("Academic OpenAI API call successful, processing suggestions")

    // Add confidence-based ranking and academic context
    return object.suggestions
      .map((suggestion) => ({
        type: suggestion.type as any,
        position: suggestion.position,
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        explanation: suggestion.explanation,
        severity: suggestion.severity,
        confidence: suggestion.confidence,
        academicContext: suggestion.academicContext,
        grammarRule: suggestion.grammarRule,
      }))
      .sort((a, b) => {
        // Sort by confidence and severity
        const severityWeight = { high: 3, medium: 2, low: 1 }
        const aScore = (a.confidence || 0) + (severityWeight[a.severity] * 10)
        const bScore = (b.confidence || 0) + (severityWeight[b.severity] * 10)
        return bScore - aScore
      })

  } catch (error) {
    console.error("Error checking academic grammar with AI:", error)
    console.log("Falling back to basic academic grammar checker")
    return checkBasicAcademicGrammar(text)
  }
}

// Fallback basic academic grammar checker
async function checkBasicAcademicGrammar(text: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = []
  
  // Import the basic grammar checker
  const { checkGrammar } = await import("../grammar-checker")
  const basicSuggestions = checkGrammar(text)
  
  // Add basic academic style checks
  const academicSuggestions = checkAcademicStyle(text)
  
  return [...basicSuggestions, ...academicSuggestions]
}

// Basic academic style checking without AI
function checkAcademicStyle(text: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  
  // Check for informal patterns
  INFORMAL_PATTERNS.forEach(({ pattern, formal }) => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const suggestion = typeof formal === 'string' 
        ? formal 
        : Array.isArray(formal) 
          ? formal[0] 
          : match[0]
          
      suggestions.push({
        type: 'academic-style',
        position: match.index,
        originalText: match[0],
        suggestedText: suggestion,
        explanation: `Consider using more formal academic language. ${
          typeof formal === 'string' 
            ? formal 
            : Array.isArray(formal) 
              ? `Try: ${formal.join(', ')}` 
              : 'Use formal academic tone'
        }`,
        severity: 'medium',
        confidence: 85,
      })
    }
  })
  
  // Check for first person usage in academic writing
  const firstPersonPattern = /\b(I|me|my|mine|we|us|our|ours)\b/g
  let match
  while ((match = firstPersonPattern.exec(text)) !== null) {
    suggestions.push({
      type: 'academic-style',
      position: match.index,
      originalText: match[0],
      suggestedText: 'third person perspective',
      explanation: 'Academic writing typically uses third person perspective. Consider rephrasing to avoid first person pronouns.',
      severity: 'low',
      confidence: 70,
    })
  }
  
  // Check for contractions
  const contractionPattern = /\b\w+'\w+\b/g
  while ((match = contractionPattern.exec(text)) !== null) {
    const expanded = expandContraction(match[0])
    if (expanded !== match[0]) {
      suggestions.push({
        type: 'academic-style',
        position: match.index,
        originalText: match[0],
        suggestedText: expanded,
        explanation: 'Avoid contractions in formal academic writing. Use the full form instead.',
        severity: 'medium',
        confidence: 95,
      })
    }
  }
  
  return suggestions
}

// Helper function to expand common contractions
function expandContraction(contraction: string): string {
  const expansions: Record<string, string> = {
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "wouldn't": "would not",
    "shouldn't": "should not",
    "couldn't": "could not",
    "it's": "it is",
    "that's": "that is",
    "there's": "there is",
    "here's": "here is",
    "what's": "what is",
    "who's": "who is",
    "you're": "you are",
    "we're": "we are",
    "they're": "they are",
  }
  
  return expansions[contraction.toLowerCase()] || contraction
}

// Get academic vocabulary suggestions for a given word
export function getAcademicVocabularySuggestions(word: string): string[] {
  const vocabularyMap: Record<string, string[]> = {
    "show": ["demonstrate", "illustrate", "reveal", "indicate"],
    "prove": ["establish", "verify", "confirm", "substantiate"],
    "say": ["state", "assert", "contend", "maintain"],
    "think": ["consider", "believe", "conclude", "propose"],
    "big": ["significant", "substantial", "considerable", "extensive"],
    "small": ["minimal", "limited", "negligible", "modest"],
    "good": ["effective", "beneficial", "advantageous", "favorable"],
    "bad": ["detrimental", "adverse", "problematic", "unfavorable"],
    "important": ["crucial", "significant", "essential", "vital"],
    "different": ["distinct", "varied", "diverse", "contrasting"],
  }
  
  return vocabularyMap[word.toLowerCase()] || []
}

// Check if text meets academic writing standards
export function assessAcademicWritingLevel(text: string): {
  score: number
  level: 'below-standard' | 'developing' | 'proficient' | 'advanced'
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 100
  
  // Check sentence length variety
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
  
  if (avgSentenceLength < 8) {
    score -= 10
    feedback.push("Consider varying sentence length for better flow")
  }
  
  // Check for academic vocabulary usage
  const words = text.toLowerCase().split(/\s+/)
  const academicWordCount = words.filter(word => 
    ACADEMIC_VOCABULARY.academicWords.includes(word) ||
    ACADEMIC_VOCABULARY.transitions.includes(word)
  ).length
  
  const academicVocabRatio = academicWordCount / words.length
  if (academicVocabRatio < 0.05) {
    score -= 15
    feedback.push("Incorporate more academic vocabulary and transitions")
  }
  
  // Check for informal language
  const informalCount = INFORMAL_PATTERNS.reduce((count, { pattern }) => {
    const matches = text.match(pattern)
    return count + (matches ? matches.length : 0)
  }, 0)
  
  if (informalCount > 0) {
    score -= informalCount * 5
    feedback.push("Avoid informal language and contractions")
  }
  
  // Determine level
  let level: 'below-standard' | 'developing' | 'proficient' | 'advanced'
  if (score >= 90) level = 'advanced'
  else if (score >= 75) level = 'proficient'
  else if (score >= 60) level = 'developing'
  else level = 'below-standard'
  
  return { score: Math.max(0, score), level, feedback }
} 