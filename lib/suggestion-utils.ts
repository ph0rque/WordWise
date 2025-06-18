import type { Suggestion, SuggestionAction } from "./types"

// Generate a unique ID for a suggestion based on its content and position
export function generateSuggestionId(suggestion: Suggestion): string {
  // Create a stable hash based on content to ensure uniqueness without timestamps
  const originalText = suggestion.originalText.replace(/\s+/g, "_").substring(0, 30)
  const suggestedText = suggestion.suggestedText?.replace(/\s+/g, "_").substring(0, 30) || "no-suggestion"
  const reasonHash = suggestion.reason ? suggestion.reason.substring(0, 10) : "no-reason"
  
  // Create a simple hash from the combined content
  const content = `${suggestion.type}-${suggestion.position}-${originalText}-${suggestedText}-${reasonHash}`
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `${suggestion.type}-${suggestion.position}-${Math.abs(hash)}`
}

// Check if a suggestion should be filtered out based on previous actions
export function shouldFilterSuggestion(
  suggestion: Suggestion,
  recentActions: SuggestionAction[],
  textContent: string,
): boolean {
  const suggestionId = generateSuggestionId(suggestion)

  // Check if this exact suggestion was recently acted upon
  const recentAction = recentActions.find(
    (action) => action.suggestionId === suggestionId && Date.now() - action.timestamp < 30000, // 30 seconds
  )

  if (recentAction) {
    // If it was applied, check if the text still contains the original text at that position
    if (recentAction.action === "applied") {
      const textAtPosition = textContent.substring(
        suggestion.position,
        suggestion.position + suggestion.originalText.length,
      )
      // If the original text is no longer there, the suggestion was successfully applied
      return textAtPosition !== suggestion.originalText
    }

    // If it was ignored, don't show it again for a while
    if (recentAction.action === "ignored") {
      return true
    }
  }

  return false
}

// Find the best match for the original text in the document
function findBestMatch(
  text: string,
  originalText: string,
  expectedPosition: number,
): { position: number; found: boolean } {
  // Strategy 1: Check exact position first
  if (expectedPosition >= 0 && expectedPosition + originalText.length <= text.length) {
    const textAtPosition = text.substring(expectedPosition, expectedPosition + originalText.length)
    if (textAtPosition === originalText) {
      return { position: expectedPosition, found: true }
    }
  }

  // Strategy 2: Search in a wider area around the expected position
  const searchRadius = Math.min(100, text.length / 4) // Search within 100 chars or 1/4 of document
  const searchStart = Math.max(0, expectedPosition - searchRadius)
  const searchEnd = Math.min(text.length, expectedPosition + originalText.length + searchRadius)
  const searchArea = text.substring(searchStart, searchEnd)

  // Try exact match in search area
  let foundIndex = searchArea.indexOf(originalText)
  if (foundIndex !== -1) {
    return { position: searchStart + foundIndex, found: true }
  }

  // Strategy 3: Try case-insensitive search
  const lowerOriginal = originalText.toLowerCase()
  const lowerSearchArea = searchArea.toLowerCase()
  foundIndex = lowerSearchArea.indexOf(lowerOriginal)
  if (foundIndex !== -1) {
    return { position: searchStart + foundIndex, found: true }
  }

  // Strategy 4: Try to find partial matches (for cases where text was partially edited)
  if (originalText.length > 3) {
    // Try finding the first few characters
    const prefix = originalText.substring(0, Math.min(originalText.length - 1, 5))
    foundIndex = searchArea.indexOf(prefix)
    if (foundIndex !== -1) {
      // Check if the text at this position makes sense
      const candidateText = searchArea.substring(foundIndex, foundIndex + originalText.length)
      if (candidateText.length === originalText.length) {
        return { position: searchStart + foundIndex, found: true }
      }
    }
  }

  // Strategy 5: Try word-boundary matching for single words
  if (!originalText.includes(" ") && originalText.length > 2) {
    const wordRegex = new RegExp(`\\b${originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    const match = searchArea.match(wordRegex)
    if (match && match.index !== undefined) {
      return { position: searchStart + match.index, found: true }
    }
  }

  return { position: -1, found: false }
}

// Apply a suggestion to text with improved positioning logic
export function applySuggestionToText(
  text: string,
  suggestion: Suggestion,
): { newText: string; success: boolean; error?: string } {
  try {
    // Validate inputs
    if (!text || !suggestion.originalText) {
      return {
        newText: text,
        success: false,
        error: "Invalid text or suggestion",
      }
    }

    // Find the best match for the original text
    const match = findBestMatch(text, suggestion.originalText, suggestion.position)

    if (!match.found) {
      // If we can't find the text, it might have already been changed
      console.log(`Could not find "${suggestion.originalText}" in text. It may have already been modified.`)
      return {
        newText: text,
        success: false,
        error: `Text "${suggestion.originalText}" not found. It may have already been changed.`,
      }
    }

    // Apply the replacement
    const before = text.substring(0, match.position)
    const after = text.substring(match.position + suggestion.originalText.length)
    const newText = before + suggestion.suggestedText + after

    // Validate the result
    if (newText.length < text.length - suggestion.originalText.length) {
      return {
        newText: text,
        success: false,
        error: "Replacement would result in invalid text",
      }
    }

    return {
      newText,
      success: true,
    }
  } catch (error) {
    console.error("Error in applySuggestionToText:", error)
    return {
      newText: text,
      success: false,
      error: `Error applying suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Update suggestion positions after text changes
export function updateSuggestionPositions(
  suggestions: Suggestion[],
  changePosition: number,
  lengthDelta: number,
): Suggestion[] {
  return suggestions
    .map((suggestion) => {
      // Only update positions that come after the change
      if (suggestion.position > changePosition) {
        const newPosition = Math.max(changePosition, suggestion.position + lengthDelta)
        return {
          ...suggestion,
          position: newPosition,
        }
      }
      // For suggestions at or before the change position, keep them as-is
      // but validate they're still valid
      return suggestion
    })
    .filter((suggestion) => {
      // Remove suggestions that would now be at invalid positions
      return (
        suggestion.position >= 0 && suggestion.position < suggestion.position + suggestion.originalText.length + 1000
      ) // reasonable upper bound
    })
}

// Validate that a suggestion is still applicable to the current text
export function validateSuggestion(suggestion: Suggestion, text: string): boolean {
  if (!suggestion.originalText || suggestion.position < 0) {
    return false
  }

  // Check if the suggestion position is within bounds
  if (suggestion.position >= text.length) {
    return false
  }

  // Try to find the original text near the expected position
  const match = findBestMatch(text, suggestion.originalText, suggestion.position)
  return match.found
}

// Clean up suggestions that are no longer valid
export function cleanupInvalidSuggestions(suggestions: Suggestion[], text: string): Suggestion[] {
  return suggestions.filter((suggestion) => validateSuggestion(suggestion, text))
}
