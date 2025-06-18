import type { Suggestion } from "./types"

export interface AcademicGrammarCheckOptions {
  academicLevel?: 'high-school' | 'college'
  subject?: string
}

export interface AcademicGrammarCheckResponse {
  suggestions: Suggestion[]
  metadata: {
    textLength: number
    academicLevel: string
    subject: string | null
    suggestionCount: number
    timestamp: string
    aiUsed: boolean
  }
}

/**
 * Check grammar with academic context using the academic grammar checker API
 */
export async function checkAcademicGrammarClient(
  text: string,
  options: AcademicGrammarCheckOptions = {}
): Promise<Suggestion[]> {
  if (!text.trim()) {
    return []
  }

  try {
    const response = await fetch('/api/ai/grammar-check-academic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        academicLevel: options.academicLevel || 'high-school',
        subject: options.subject,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to check grammar')
    }

    const data: AcademicGrammarCheckResponse = await response.json()
    return data.suggestions

  } catch (error) {
    console.error('Error checking academic grammar:', error)
    
    // Fallback to basic grammar checking if academic API fails
    try {
      const fallbackResponse = await fetch('/api/grammar-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        console.log('Falling back to basic grammar checker')
        return fallbackData.suggestions || []
      }
    } catch (fallbackError) {
      console.error('Fallback grammar check also failed:', fallbackError)
    }

    // Return empty array if all else fails
    return []
  }
}

/**
 * Get academic vocabulary suggestions for a word
 */
export async function getAcademicVocabularySuggestionsClient(word: string): Promise<string[]> {
  try {
    // For now, use the client-side function directly
    // In the future, this could be moved to an API endpoint for more sophisticated suggestions
    const { getAcademicVocabularySuggestions } = await import('./ai/academic-grammar-checker')
    return getAcademicVocabularySuggestions(word)
  } catch (error) {
    console.error('Error getting vocabulary suggestions:', error)
    return []
  }
}

/**
 * Assess the academic writing level of text
 */
export async function assessAcademicWritingLevelClient(text: string) {
  try {
    // For now, use the client-side function directly
    // In the future, this could be moved to an API endpoint for more sophisticated analysis
    const { assessAcademicWritingLevel } = await import('./ai/academic-grammar-checker')
    return assessAcademicWritingLevel(text)
  } catch (error) {
    console.error('Error assessing writing level:', error)
    return {
      score: 0,
      level: 'below-standard' as const,
      feedback: ['Unable to assess writing level']
    }
  }
}

/**
 * Enhanced grammar checking with confidence scoring and academic context
 * This is the main function that should replace the existing grammar checker in the UI
 */
export async function enhancedGrammarCheck(
  text: string,
  options: AcademicGrammarCheckOptions & {
    enableAcademicMode?: boolean
  } = {}
): Promise<{
  suggestions: Suggestion[]
  academicAssessment?: {
    score: number
    level: 'below-standard' | 'developing' | 'proficient' | 'advanced'
    feedback: string[]
  }
}> {
  const { enableAcademicMode = true, ...academicOptions } = options

  // Get suggestions
  const suggestions = enableAcademicMode 
    ? await checkAcademicGrammarClient(text, academicOptions)
    : await checkBasicGrammarClient(text)

  // Get academic assessment if in academic mode
  let academicAssessment
  if (enableAcademicMode && text.length > 50) {
    academicAssessment = await assessAcademicWritingLevelClient(text)
  }

  return {
    suggestions,
    academicAssessment
  }
}

/**
 * Fallback to basic grammar checking
 */
async function checkBasicGrammarClient(text: string): Promise<Suggestion[]> {
  try {
    const response = await fetch('/api/grammar-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error('Basic grammar check failed')
    }

    const data = await response.json()
    return data.suggestions || []

  } catch (error) {
    console.error('Error with basic grammar check:', error)
    return []
  }
}

/**
 * Check if academic grammar checking is available
 */
export async function isAcademicGrammarAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai-status')
    if (response.ok) {
      const data = await response.json()
      return data.available === true
    }
    return false
  } catch (error) {
    console.error('Error checking academic grammar availability:', error)
    return false
  }
} 