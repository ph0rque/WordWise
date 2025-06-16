export type SuggestionType = "grammar" | "spelling" | "style"

export interface Suggestion {
  type: SuggestionType
  position: number
  originalText: string
  suggestedText: string
  explanation: string
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
