import type { Suggestion, GrammarCheckSettings } from "./types"

// Client-side function to check AI availability
export async function checkAIAvailability(): Promise<boolean> {
  try {
    const response = await fetch("/api/ai-status")
    const data = await response.json()
    return data.available || false
  } catch (error) {
    console.error("Error checking AI availability:", error)
    return false
  }
}

// Client-side function to perform grammar check via API
export async function performGrammarCheck(
  text: string,
  settings: GrammarCheckSettings,
): Promise<{ suggestions: Suggestion[]; aiUsed: boolean }> {
  try {
    const response = await fetch("/api/grammar-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, settings }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      suggestions: data.suggestions || [],
      aiUsed: data.aiUsed || false,
    }
  } catch (error) {
    console.error("Error performing grammar check:", error)
    // Fallback to basic checking on client
    const { checkGrammar } = await import("./grammar-checker")
    return {
      suggestions: checkGrammar(text),
      aiUsed: false,
    }
  }
}
