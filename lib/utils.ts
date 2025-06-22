import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardized word counting function used across all analysis components
 * Uses word boundary regex for consistent results
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0
  
  // Use word boundary regex to match words consistently
  // This handles punctuation, contractions, and special characters properly
  const words = text.match(/\b\w+\b/g)
  return words ? words.length : 0
}

/**
 * Extract words as an array for vocabulary analysis
 * Uses the same method as countWords for consistency
 */
export function extractWords(text: string): string[] {
  if (!text || !text.trim()) return []
  
  // Use word boundary regex and normalize to lowercase
  const words = text.toLowerCase().match(/\b\w+\b/g)
  return words || []
}

/**
 * Debug utility to track loading states and identify bottlenecks
 */
export class LoadingTracker {
  private static instance: LoadingTracker
  private loadingStates: Map<string, { start: number; description: string }> = new Map()
  private isDebugMode: boolean = process.env.NODE_ENV === 'development'

  static getInstance(): LoadingTracker {
    if (!LoadingTracker.instance) {
      LoadingTracker.instance = new LoadingTracker()
    }
    return LoadingTracker.instance
  }

  /**
   * Start tracking a loading operation
   */
  startLoading(key: string, description: string = ''): void {
    if (!this.isDebugMode) return
    
    this.loadingStates.set(key, {
      start: Date.now(),
      description
    })
    console.log(`🔄 Loading started: ${key} ${description ? `(${description})` : ''}`)
  }

  /**
   * End tracking a loading operation
   */
  endLoading(key: string): void {
    if (!this.isDebugMode) return
    
    const state = this.loadingStates.get(key)
    if (state) {
      const duration = Date.now() - state.start
      console.log(`✅ Loading completed: ${key} ${state.description ? `(${state.description})` : ''} - ${duration}ms`)
      this.loadingStates.delete(key)
    }
  }

  /**
   * Mark a loading operation as failed
   */
  failLoading(key: string, error?: string): void {
    if (!this.isDebugMode) return
    
    const state = this.loadingStates.get(key)
    if (state) {
      const duration = Date.now() - state.start
      console.error(`❌ Loading failed: ${key} ${state.description ? `(${state.description})` : ''} - ${duration}ms`, error || '')
      this.loadingStates.delete(key)
    }
  }

  /**
   * Get all currently active loading operations
   */
  getActiveLoadingStates(): Array<{ key: string; duration: number; description: string }> {
    if (!this.isDebugMode) return []
    
    const now = Date.now()
    return Array.from(this.loadingStates.entries()).map(([key, state]) => ({
      key,
      duration: now - state.start,
      description: state.description
    }))
  }

  /**
   * Log all active loading states (useful for debugging stuck states)
   */
  debugActiveStates(): void {
    if (!this.isDebugMode) return
    
    const activeStates = this.getActiveLoadingStates()
    if (activeStates.length === 0) {
      console.log('🟢 No active loading states')
      return
    }

    console.group('🔍 Active Loading States:')
    activeStates.forEach(({ key, duration, description }) => {
      const status = duration > 10000 ? '🔴 STUCK' : duration > 5000 ? '🟡 SLOW' : '🟢 OK'
      console.log(`${status} ${key}: ${duration}ms ${description ? `(${description})` : ''}`)
    })
    console.groupEnd()
  }

  /**
   * Set up automatic debugging for stuck states
   */
  setupAutoDebug(): void {
    if (!this.isDebugMode) return
    
    setInterval(() => {
      const activeStates = this.getActiveLoadingStates()
      const stuckStates = activeStates.filter(state => state.duration > 10000)
      
      if (stuckStates.length > 0) {
        console.warn('⚠️ Detected stuck loading states:')
        stuckStates.forEach(({ key, duration, description }) => {
          console.warn(`- ${key}: ${duration}ms ${description ? `(${description})` : ''}`)
        })
      }
    }, 15000) // Check every 15 seconds
  }
}

// Export singleton instance
export const loadingTracker = LoadingTracker.getInstance()

// Auto-setup debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  loadingTracker.setupAutoDebug()
  
  // Add global debug function
  ;(window as any).debugLoading = () => loadingTracker.debugActiveStates()
}
