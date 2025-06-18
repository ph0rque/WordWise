export type SuggestionType = "grammar" | "spelling" | "style" | "clarity" | "tone" | "academic-style" | "vocabulary"

export interface Suggestion {
  type: SuggestionType
  position: number
  originalText: string
  suggestedText: string
  explanation: string
  severity?: "low" | "medium" | "high"
  id?: string // Add unique ID for tracking
  confidence?: number // Confidence score 0-100 for AI suggestions
  academicContext?: string // Academic writing context for educational feedback
  grammarRule?: string // Specific grammar rule violated
}

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export type UserRole = "student" | "admin"

export interface User {
  id: string
  email: string
  role?: UserRole
  created_at?: string
  updated_at?: string
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

// Role-based permission types
export interface RolePermissions {
  canViewAllDocuments: boolean
  canViewKeystrokeRecordings: boolean
  canManageUsers: boolean
  canAccessAnalytics: boolean
  canExportData: boolean
}

// User with role-specific data
export interface UserWithRole extends User {
  role: UserRole
  permissions: RolePermissions
  email_confirmed_at?: string | null
  last_sign_in_at?: string | null
}

// Role configuration
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  student: {
    canViewAllDocuments: false,
    canViewKeystrokeRecordings: false,
    canManageUsers: false,
    canAccessAnalytics: false,
    canExportData: false,
  },
  admin: {
    canViewAllDocuments: true,
    canViewKeystrokeRecordings: true,
    canManageUsers: true,
    canAccessAnalytics: true,
    canExportData: true,
  },
}

export interface GrammarRule {
  id: string
  name: string
  category: 'punctuation' | 'grammar' | 'style' | 'spelling' | 'academic-style' | 'vocabulary'
  description: string
  explanation: string
  examples: {
    incorrect: string
    correct: string
    explanation?: string
  }[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  commonMistakes: string[]
  tips: string[]
  relatedRules?: string[]
}

export interface EducationalFeedback {
  ruleId: string
  ruleName: string
  category: GrammarRule['category']
  explanation: string
  examples: GrammarRule['examples']
  tips: string[]
  difficulty: GrammarRule['difficulty']
  learningObjective: string
  practiceExercise?: {
    instruction: string
    examples: string[]
  }
}

export interface EnhancedSuggestion extends Suggestion {
  educationalFeedback?: EducationalFeedback
  grammarRule?: string
  learningValue: 'high' | 'medium' | 'low'
  mistakePattern?: string
  improvementTip?: string
}
