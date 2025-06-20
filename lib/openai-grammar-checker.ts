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
      model: openai("gpt-4.1-nano"),
      schema: SuggestionSchema,
      prompt: `
        Analyze the following text for grammar, spelling, style, clarity, and tone issues. 
        Provide specific suggestions with exact positions in the text.
        
        For each issue found:
        1. Identify the exact position (character index) where the issue starts
        2. Specify the original problematic text
        3. Provide a corrected version
        4. Explain why the change is needed
        5. Rate the severity (low, medium, high)
        
        Focus on:
        - Grammar errors (subject-verb agreement, tense consistency, etc.)
        - Spelling mistakes
        - Style improvements (wordiness, passive voice, etc.)
        - Clarity issues (unclear sentences, ambiguous pronouns)
        - Tone consistency
        
        Text to analyze:
        "${text}"
        
        Return suggestions in order of appearance in the text.
      `,
    })

    console.log("OpenAI API call successful, processing suggestions")

    return object.suggestions.map((suggestion) => ({
      type: suggestion.type as any,
      position: suggestion.position,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      explanation: suggestion.explanation,
      severity: suggestion.severity,
    }))
  } catch (error) {
    console.error("Error checking grammar with AI:", error)
    // Fallback to basic grammar checker
    console.log("Falling back to basic grammar checker")
    const { checkGrammar } = await import("./grammar-checker")
    return checkGrammar(text)
  }
}
