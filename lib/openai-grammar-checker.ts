import type { Suggestion } from "./types"

// Check if OpenAI API key is available
function isOpenAIAvailable(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)
}

export async function checkGrammarWithAI(text: string): Promise<Suggestion[]> {
  if (!text.trim() || text.length < 10) {
    return []
  }

  // Check if OpenAI is available
  if (!isOpenAIAvailable()) {
    console.log("OpenAI API key not found, falling back to basic grammar checker")
    const { checkGrammar } = await import("./grammar-checker")
    return checkGrammar(text)
  }

  try {
    // Dynamic import to avoid loading OpenAI if not needed
    const { openai } = await import("@ai-sdk/openai")
    const { generateObject } = await import("ai")
    const { z } = await import("zod")

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

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
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
    const { checkGrammar } = await import("./grammar-checker")
    return checkGrammar(text)
  }
}

export async function checkGrammarStreaming(
  text: string,
  onSuggestion: (suggestion: Suggestion) => void,
): Promise<void> {
  if (!text.trim() || text.length < 10) {
    return
  }

  // Check if OpenAI is available
  if (!isOpenAIAvailable()) {
    console.log("OpenAI API key not found, using basic grammar checker")
    const { checkGrammar } = await import("./grammar-checker")
    const suggestions = checkGrammar(text)
    suggestions.forEach(onSuggestion)
    return
  }

  try {
    // Dynamic import to avoid loading OpenAI if not needed
    const { openai } = await import("@ai-sdk/openai")
    const { generateObject } = await import("ai")
    const { z } = await import("zod")

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

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: SuggestionSchema,
      prompt: `
        Analyze this text for writing issues and provide suggestions:
        
        "${text}"
        
        Focus on the most important issues first. Provide practical, actionable suggestions.
      `,
    })

    // Process suggestions one by one
    object.suggestions.forEach((suggestion) => {
      onSuggestion({
        type: suggestion.type as any,
        position: suggestion.position,
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        explanation: suggestion.explanation,
        severity: suggestion.severity,
      })
    })
  } catch (error) {
    console.error("Error with streaming grammar check:", error)
    // Fallback to basic grammar checker
    const { checkGrammar } = await import("./grammar-checker")
    const suggestions = checkGrammar(text)
    suggestions.forEach(onSuggestion)
  }
}

// Export function to check if AI is available
export { isOpenAIAvailable }
