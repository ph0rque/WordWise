import { NextRequest, NextResponse } from 'next/server'
import {
  WritingSession,
  MistakePattern,
  ProgressReport,
  createWritingSession,
  trackMistakePatterns,
  generateProgressReport
} from '@/lib/analysis/progress-tracking'
import { EnhancedSuggestion } from '@/lib/types'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('Progress tracking POST request received')
    
    const body = await request.json()
    const { action, userId, text, suggestions, documentId, existingPatterns, sessions, mistakePatterns, timeframe } = body
    
    // Validate required fields
    if (!action || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: action and userId are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    let result: any = {}
    
    switch (action) {
      case 'create-session':
        if (!text || !Array.isArray(suggestions)) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields for create-session: text and suggestions array required',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        console.log(`Creating writing session for user ${userId}`)
        const session = createWritingSession(userId, text, suggestions as EnhancedSuggestion[], documentId)
        
        result = {
          session,
          metrics: session.metrics,
          improvements: session.improvements
        }
        break
      
      case 'track-mistakes':
        if (!Array.isArray(suggestions) || !body.sessionId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields for track-mistakes: suggestions array and sessionId required',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        console.log(`Tracking mistake patterns for user ${userId}, session ${body.sessionId}`)
        const patterns = trackMistakePatterns(
          userId, 
          suggestions as EnhancedSuggestion[], 
          body.sessionId,
          existingPatterns as MistakePattern[] || []
        )
        
        result = {
          patterns,
          newPatterns: patterns.filter(p => !existingPatterns?.some((ep: MistakePattern) => ep.id === p.id)),
          updatedPatterns: patterns.filter(p => existingPatterns?.some((ep: MistakePattern) => ep.id === p.id))
        }
        break
      
      case 'generate-report':
        if (!Array.isArray(sessions)) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required fields for generate-report: sessions array required',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        console.log(`Generating progress report for user ${userId}, timeframe: ${timeframe || 'week'}`)
        const report = generateProgressReport(
          userId,
          sessions as WritingSession[],
          mistakePatterns as MistakePattern[] || [],
          timeframe as 'week' | 'month' | 'semester' || 'week'
        )
        
        result = {
          report,
          summary: {
            totalSessions: report.totalSessions,
            totalWordsWritten: report.totalWordsWritten,
            averageReadabilityImprovement: report.averageReadabilityImprovement,
            errorReductionPercentage: report.errorReductionPercentage,
            currentStreak: report.currentStreak,
            topRecommendations: report.recommendations.slice(0, 3)
          }
        }
        break
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}. Valid actions are: create-session, track-mistakes, generate-report`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
    }
    
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    console.log(`Progress tracking ${action} completed in ${processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      action,
      userId,
      data: result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })
    
  } catch (error) {
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    console.error('Progress tracking POST error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('Progress tracking GET request received')
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    
    if (!action) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: action',
          availableActions: ['session-metrics', 'user-stats', 'health-check'],
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    let result: any = {}
    
    switch (action) {
      case 'session-metrics':
        const text = searchParams.get('text')
        const suggestionsParam = searchParams.get('suggestions')
        
        if (!text) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required parameter for session-metrics: text',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        let suggestions: EnhancedSuggestion[] = []
        if (suggestionsParam) {
          try {
            suggestions = JSON.parse(suggestionsParam)
          } catch (e) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Invalid JSON format for suggestions parameter',
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            )
          }
        }
        
        // Import here to avoid circular dependencies
        const { calculateSessionMetrics } = await import('@/lib/analysis/progress-tracking')
        const metrics = calculateSessionMetrics(text, suggestions)
        
        result = {
          metrics,
          textAnalysis: {
            characterCount: text.length,
            wordCount: metrics.wordCount,
            sentenceCount: metrics.sentenceCount,
            paragraphCount: metrics.paragraphCount
          },
          suggestionAnalysis: {
            total: metrics.totalSuggestions,
            byType: {
              grammar: metrics.grammarErrors,
              style: metrics.styleErrors,
              vocabulary: metrics.vocabularyErrors,
              academicStyle: metrics.academicStyleErrors
            },
            byLearningValue: {
              high: metrics.highLearningValueSuggestions,
              medium: metrics.mediumLearningValueSuggestions,
              low: metrics.lowLearningValueSuggestions
            }
          }
        }
        break
      
      case 'user-stats':
        if (!userId) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Missing required parameter for user-stats: userId',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        // This would typically fetch from database
        // For now, return mock stats
        result = {
          userId,
          stats: {
            totalSessions: 0,
            totalWordsWritten: 0,
            averageSessionLength: 0,
            currentStreak: 0,
            lastSessionDate: null,
            topMistakePatterns: [],
            improvementTrend: 'stable'
          },
          note: 'This endpoint would typically fetch real user statistics from the database'
        }
        break
      
      case 'health-check':
        result = {
          status: 'healthy',
          service: 'progress-tracking',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          features: {
            sessionCreation: 'available',
            mistakeTracking: 'available',
            reportGeneration: 'available',
            metricsCalculation: 'available'
          }
        }
        break
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}. Valid actions are: session-metrics, user-stats, health-check`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
    }
    
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    console.log(`Progress tracking GET ${action} completed in ${processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })
    
  } catch (error) {
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    console.error('Progress tracking GET error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
} 