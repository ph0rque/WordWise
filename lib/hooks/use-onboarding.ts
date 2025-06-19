import { useState, useEffect } from 'react'

interface OnboardingState {
  isFirstVisit: boolean
  hasCompletedOnboarding: boolean
  showOnboarding: boolean
  lastStep: number
}

interface UseOnboardingOptions {
  userId?: string
  skipForReturningUsers?: boolean
}

export function useOnboarding({ userId, skipForReturningUsers = true }: UseOnboardingOptions = {}) {
  const [state, setState] = useState<OnboardingState>({
    isFirstVisit: true,
    hasCompletedOnboarding: false,
    showOnboarding: false,
    lastStep: 0
  })

  // Storage key for onboarding state
  const getStorageKey = (key: string) => {
    return userId ? `onboarding_${key}_${userId}` : `onboarding_${key}`
  }

  // Load onboarding state from localStorage
  useEffect(() => {
    try {
      const hasCompletedKey = getStorageKey('completed')
      const lastStepKey = getStorageKey('lastStep')
      const firstVisitKey = getStorageKey('firstVisit')

      const hasCompleted = localStorage.getItem(hasCompletedKey) === 'true'
      const lastStep = parseInt(localStorage.getItem(lastStepKey) || '0', 10)
      const hasVisited = localStorage.getItem(firstVisitKey) === 'false'

      const isFirstVisit = !hasVisited
      const shouldShowOnboarding = isFirstVisit || (!hasCompleted && !skipForReturningUsers)

      setState({
        isFirstVisit,
        hasCompletedOnboarding: hasCompleted,
        showOnboarding: shouldShowOnboarding,
        lastStep
      })

      // Mark as visited
      if (isFirstVisit) {
        localStorage.setItem(firstVisitKey, 'false')
      }
    } catch (error) {
      console.warn('Failed to load onboarding state from localStorage:', error)
      // Default to showing onboarding if we can't read from storage
      setState(prev => ({
        ...prev,
        showOnboarding: true
      }))
    }
  }, [userId, skipForReturningUsers])

  // Mark onboarding as completed
  const completeOnboarding = () => {
    try {
      const hasCompletedKey = getStorageKey('completed')
      localStorage.setItem(hasCompletedKey, 'true')
      
      setState(prev => ({
        ...prev,
        hasCompletedOnboarding: true,
        showOnboarding: false
      }))
    } catch (error) {
      console.warn('Failed to save onboarding completion to localStorage:', error)
    }
  }

  // Skip onboarding
  const skipOnboarding = () => {
    try {
      const hasCompletedKey = getStorageKey('completed')
      localStorage.setItem(hasCompletedKey, 'true')
      
      setState(prev => ({
        ...prev,
        showOnboarding: false
      }))
    } catch (error) {
      console.warn('Failed to save onboarding skip to localStorage:', error)
    }
  }

  // Reset onboarding (useful for testing or if user wants to see it again)
  const resetOnboarding = () => {
    try {
      const hasCompletedKey = getStorageKey('completed')
      const lastStepKey = getStorageKey('lastStep')
      const firstVisitKey = getStorageKey('firstVisit')

      localStorage.removeItem(hasCompletedKey)
      localStorage.removeItem(lastStepKey)
      localStorage.removeItem(firstVisitKey)

      setState({
        isFirstVisit: true,
        hasCompletedOnboarding: false,
        showOnboarding: true,
        lastStep: 0
      })
    } catch (error) {
      console.warn('Failed to reset onboarding state:', error)
    }
  }

  // Save progress (for resuming onboarding later)
  const saveProgress = (step: number) => {
    try {
      const lastStepKey = getStorageKey('lastStep')
      localStorage.setItem(lastStepKey, step.toString())
      
      setState(prev => ({
        ...prev,
        lastStep: step
      }))
    } catch (error) {
      console.warn('Failed to save onboarding progress:', error)
    }
  }

  // Start onboarding (useful for "Show Tour Again" feature)
  const startOnboarding = () => {
    setState(prev => ({
      ...prev,
      showOnboarding: true
    }))
  }

  return {
    // State
    isFirstVisit: state.isFirstVisit,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    showOnboarding: state.showOnboarding,
    lastStep: state.lastStep,
    
    // Actions
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    saveProgress,
    startOnboarding
  }
}

// Helper hook for checking if user should see onboarding
export function useShouldShowOnboarding(userId?: string) {
  const { showOnboarding, isFirstVisit } = useOnboarding({ userId })
  return { shouldShow: showOnboarding, isFirstVisit }
}

// Hook for onboarding analytics (optional - for tracking completion rates)
export function useOnboardingAnalytics() {
  const trackOnboardingStart = () => {
    // In a real app, you would send analytics events here
    console.log('Onboarding started')
  }

  const trackOnboardingComplete = () => {
    console.log('Onboarding completed')
  }

  const trackOnboardingSkipped = (atStep: number) => {
    console.log(`Onboarding skipped at step ${atStep}`)
  }

  const trackStepViewed = (stepId: string, stepNumber: number) => {
    console.log(`Onboarding step viewed: ${stepId} (${stepNumber})`)
  }

  return {
    trackOnboardingStart,
    trackOnboardingComplete,
    trackOnboardingSkipped,
    trackStepViewed
  }
} 