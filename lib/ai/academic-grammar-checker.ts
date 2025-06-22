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
        You are a conservative academic writing checker specializing in ${academicLevel} level writing.
        ${subjectContext}${levelContext}
        
        CRITICAL INSTRUCTION: Only flag issues you are absolutely certain about (90%+ confidence). 
        When in doubt, DO NOT flag. It's better to miss an issue than create false positives.
        
        PRIORITY FOCUS: Check MOST RECENT CONTENT first (last 10-15 words), then entire text.
        
        DEFINITE ERRORS TO FLAG (only if very confident):
        
        1. SPELLING ERRORS (flag only if 95%+ confident):
           - Obviously misspelled words with clear corrections
           - Clear typos (character transpositions, missing letters)
           - Wrong homophones in unambiguous context (their/there/they're when meaning is clear)
           - Common spelling mistakes with obvious fixes
        
        2. GRAMMAR ERRORS (flag only if 90%+ confident):
           - Clear subject-verb agreement errors ("He are going")
           - Obvious verb tense mistakes ("Yesterday I go to school")
           - Sentence fragments that are clearly incomplete
           - Run-on sentences with obvious comma splice errors
           - Clear apostrophe mistakes (possessive vs. plural confusion)
           - Wrong prepositions in standard phrases
           - Clear article errors (a/an/the in obvious contexts)
        
        DO NOT FLAG:
        - Correctly spelled but uncommon words
        - Technical terms, proper nouns, brand names
        - Creative writing or intentional stylistic choices
        - Complex but grammatically correct sentences
        - Informal language that's contextually appropriate
        - Style preferences or optional improvements
        - Words that might be foreign language terms
        - Specialized academic or domain-specific vocabulary
        - Colloquialisms or dialectical variations
        - Contractions (unless specifically incorrect)
        
        SPECIAL CARE FOR INCREMENTAL CHECKING:
        - If analyzing a text fragment, be extra cautious
        - Focus on obvious spelling/grammar errors only
        - Don't flag incomplete sentences as fragments if they appear to be work-in-progress
        - Position calculations must be precise (0-based character index)
        
        CONFIDENCE REQUIREMENTS:
        - Spelling: 95%+ confidence required
        - Grammar: 90%+ confidence required  
        - Style: 85%+ confidence required (use sparingly)
        - Only return suggestions that meet these thresholds
        
        For each DEFINITE error:
        - Exact character position (0-based, count carefully)
        - Precise problematic text
        - Clear correction
        - Brief explanation of the specific error
        - Honest confidence rating (0-100%)
        
        Text to analyze:
        "${text}"
        
        REMEMBER: Conservative checking prevents user frustration. Only flag clear, unambiguous errors.
        Return only high-confidence errors, ordered by confidence and severity.
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
      // Filter out low-confidence suggestions to prevent false positives
      .filter((suggestion) => {
        const minConfidence = suggestion.type === 'spelling' ? 95 : 
                             suggestion.type === 'grammar' ? 90 : 85
        return (suggestion.confidence || 0) >= minConfidence
      })
      // Additional filtering for common false positives
      .filter((suggestion) => {
        const originalLower = suggestion.originalText.toLowerCase()
        
        // Don't flag common proper nouns or technical terms
        const commonProperNouns = ['google', 'facebook', 'twitter', 'youtube', 'instagram', 
                                  'microsoft', 'apple', 'amazon', 'netflix', 'zoom', 'covid', 
                                  'iphone', 'android', 'wifi', 'bluetooth', 'javascript', 'python',
                                  'github', 'linkedin', 'whatsapp', 'spotify', 'uber', 'airbnb']
        
        if (commonProperNouns.includes(originalLower)) {
          return false
        }
        
        // Don't flag single letters (often part of abbreviations or variables)
        if (suggestion.originalText.length === 1) {
          return false
        }
        
        // Don't flag words that are likely abbreviations or acronyms
        if (/^[A-Z]{2,}$/g.test(suggestion.originalText)) {
          return false
        }
        
        // Don't flag contractions unless explicitly marked as grammar errors
        if (suggestion.originalText.includes("'") && suggestion.type !== 'grammar') {
          return false
        }
        
        return true
      })
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