export type SuggestionType = "grammar" | "spelling" | "style" | "clarity" | "tone"

export interface Suggestion {
  type: SuggestionType
  position: number
  originalText: string
  suggestedText: string
  explanation: string
  severity?: "low" | "medium" | "high"
  id?: string // Add unique ID for tracking
}

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
}

export interface GrammarCheckSettings {
  enableAI: boolean
  checkGrammar: boolean
  checkSpelling: boolean
  checkStyle: boolean
  checkClarity: boolean
  checkTone: boolean
}

// New interface for tracking suggestion actions
export interface SuggestionAction {
  suggestionId: string
  action: "applied" | "ignored"
  originalText: string
  position: number
  timestamp: number
}
