import type { Suggestion, SuggestionAction } from "./types"

// Generate a unique ID for a suggestion based on its content and position
export function generateSuggestionId(suggestion: Suggestion): string {
  return `${suggestion.type}-${suggestion.position}-${suggestion.originalText.replace(/\s+/g, "_")}`
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

// Apply a suggestion to text with improved positioning logic
export function applySuggestionToText(
  text: string,
  suggestion: Suggestion,
): { newText: string; success: boolean; error?: string } {
  try {
    // Validate position bounds
    if (suggestion.position < 0 || suggestion.position >= text.length) {
      return {
        newText: text,
        success: false,
        error: "Suggestion position is out of bounds",
      }
    }

    // Get the text at the suggested position
    const endPosition = suggestion.position + suggestion.originalText.length
    if (endPosition > text.length) {
      return {
        newText: text,
        success: false,
        error: "Suggestion extends beyond text length",
      }
    }

    const textAtPosition = text.substring(suggestion.position, endPosition)

    // Check if the text at the position matches exactly
    if (textAtPosition === suggestion.originalText) {
      // Direct match - apply the suggestion
      const before = text.substring(0, suggestion.position)
      const after = text.substring(endPosition)
      const newText = before + suggestion.suggestedText + after

      return {
        newText,
        success: true,
      }
    }

    // If no exact match, try to find the text nearby (within 50 characters)
    const searchStart = Math.max(0, suggestion.position - 25)
    const searchEnd = Math.min(text.length, suggestion.position + suggestion.originalText.length + 25)
    const searchArea = text.substring(searchStart, searchEnd)

    const foundIndex = searchArea.indexOf(suggestion.originalText)
    if (foundIndex !== -1) {
      const actualPosition = searchStart + foundIndex
      const actualEndPosition = actualPosition + suggestion.originalText.length

      const before = text.substring(0, actualPosition)
      const after = text.substring(actualEndPosition)
      const newText = before + suggestion.suggestedText + after

      return {
        newText,
        success: true,
      }
    }

    // If still no match, try case-insensitive search
    const lowerOriginal = suggestion.originalText.toLowerCase()
    const lowerSearchArea = searchArea.toLowerCase()
    const caseInsensitiveIndex = lowerSearchArea.indexOf(lowerOriginal)

    if (caseInsensitiveIndex !== -1) {
      const actualPosition = searchStart + caseInsensitiveIndex
      const actualEndPosition = actualPosition + suggestion.originalText.length

      const before = text.substring(0, actualPosition)
      const after = text.substring(actualEndPosition)
      const newText = before + suggestion.suggestedText + after

      return {
        newText,
        success: true,
      }
    }

    return {
      newText: text,
      success: false,
      error: `Could not find "${suggestion.originalText}" in the expected location`,
    }
  } catch (error) {
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
        return {
          ...suggestion,
          position: Math.max(changePosition, suggestion.position + lengthDelta),
        }
      }
      return suggestion
    })
    .filter(
      (suggestion) =>
        // Remove suggestions that would now be at invalid positions
        suggestion.position >= 0 && suggestion.position < suggestion.position + suggestion.originalText.length,
    )
}
