import type { Suggestion } from "./types"

// Check if OpenAI is available on the server (this will be called from API routes)
export function isOpenAIAvailable(): boolean {
  // Only check server-side environment variable
  const hasKey = !!process.env.OPENAI_API_KEY
  console.log("OpenAI API key check (server-side):", hasKey ? "Available" : "Not available")
  return hasKey
}

export async function checkGrammarWithAI(text: string): Promise<Suggestion[]> {
  if (!text.trim() || text.length < 10) {
    return []
  }

  // Check if OpenAI is available first
  if (!isOpenAIAvailable()) {
    console.log("OpenAI API key not found, falling back to basic grammar checker")
    const { checkGrammar } = await import("./grammar-checker")
    return checkGrammar(text)
  }

  try {
    // Dynamic import and create client only when we know the key exists
    const { createOpenAI } = await import("@ai-sdk/openai")
    const { generateObject } = await import("ai")
    const { z } = await import("zod")

    // Get API key from server environment only
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("API key not found after availability check")
    }

    console.log("Using OpenAI API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "Not found")

    console.log("Creating OpenAI client with API key")

    // Create OpenAI client with explicit API key
    const openai = createOpenAI({
      apiKey: apiKey,
    })

    const SuggestionSchema = z.object({
      suggestions: z.array(
        z.object({
          type: z.enum(["grammar", "spelling", "style", "clarity", "tone"]),
          position: z.number(),
          originalText: z.string(),
          suggestedText: z.string(),
          explanation: z.string(),
          severity: z.enum(["low", "medium", "high"]),
        }),
      ),
    })

    console.log("Calling OpenAI API for grammar check")

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: SuggestionSchema,
      prompt: `
        You are a conservative and accurate grammar and spelling checker. Your goal is to identify ONLY clear, unambiguous errors. 
        
        CRITICAL: Only flag issues you are absolutely certain about (95%+ confidence). When in doubt, DO NOT flag.
        
        WHAT TO FLAG (only if 100% certain):
        1. SPELLING ERRORS:
           - Completely misspelled words (e.g., "recieve" → "receive")
           - Clear typos with obvious corrections (e.g., "teh" → "the")
           - Wrong homophones in clear context (e.g., "their going" → "they're going")
        
        2. GRAMMAR ERRORS:
           - Clear subject-verb disagreement (e.g., "He are going" → "He is going")
           - Obvious tense errors (e.g., "Yesterday I go" → "Yesterday I went")
           - Missing articles when absolutely required (e.g., "I saw dog" → "I saw a dog")
        
        WHAT NOT TO FLAG:
        - Correctly spelled words that might sound unusual
        - Style preferences or optional improvements
        - Words that are contextually appropriate
        - Technical terms, proper nouns, or specialized vocabulary
        - Minor stylistic variations
        - Complex sentences that are grammatically correct
        - Creative or informal expressions that aren't errors
        - Contractions and informal language (unless explicitly incorrect)
        
        POSITION ACCURACY:
        - Calculate exact character positions carefully
        - Count from the beginning of the text (0-based index)
        - Double-check your position calculations
        
        For each DEFINITE error:
        1. Identify exact position (character index) where error starts
        2. Specify the exact problematic text
        3. Provide the correct version
        4. Explain briefly why it's wrong
        5. Rate severity appropriately
        
        Text to analyze:
        "${text}"
        
        Remember: It's better to miss a minor issue than to flag something that's actually correct.
        Return only definite errors, ordered by confidence level.
      `,
    })

    console.log("OpenAI API call successful, processing suggestions")

    return object.suggestions
      .map((suggestion) => ({
        type: suggestion.type as any,
        position: suggestion.position,
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        explanation: suggestion.explanation,
        severity: suggestion.severity,
      }))
      // Filter out likely false positives
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
        
        // Don't flag contractions unless they're clearly wrong
        if (suggestion.originalText.includes("'") && suggestion.type !== 'grammar') {
          return false
        }
        
        return true
      })
  } catch (error) {
    console.error("Error checking grammar with AI:", error)
    // Fallback to basic grammar checker
    console.log("Falling back to basic grammar checker")
    const { checkGrammar } = await import("./grammar-checker")
    return checkGrammar(text)
  }
}
