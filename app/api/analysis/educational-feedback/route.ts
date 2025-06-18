import { NextRequest, NextResponse } from 'next/server'
import { 
  enhanceSuggestionsWithEducation,
  generateEducationalReport,
  getGrammarRule,
  getAllGrammarRules,
  searchGrammarRules,
  createEducationalFeedback,
  identifyMistakePatterns
} from '@/lib/analysis/educational-feedback'
import { Suggestion } from '@/lib/types'

// POST /api/analysis/educational-feedback - Enhance suggestions with educational feedback
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('Educational feedback enhancement requested')
    
    const body = await request.json()
    const { suggestions, text, generateReport = false } = body

    // Validate required fields
    if (!suggestions || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { 
          error: 'Missing or invalid suggestions array',
          success: false 
        },
        { status: 400 }
      )
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { 
          error: 'Missing or invalid text content',
          success: false 
        },
        { status: 400 }
      )
    }

    console.log(`Enhancing ${suggestions.length} suggestions for ${text.length} characters`)

    // Validate suggestion format
    const validSuggestions = suggestions.filter((suggestion: any) => 
      suggestion && 
      typeof suggestion.type === 'string' &&
      typeof suggestion.position === 'number' &&
      typeof suggestion.originalText === 'string' &&
      typeof suggestion.suggestedText === 'string' &&
      typeof suggestion.explanation === 'string'
    )

    if (validSuggestions.length !== suggestions.length) {
      console.warn(`Filtered ${suggestions.length - validSuggestions.length} invalid suggestions`)
    }

    // Enhance suggestions with educational feedback
    const enhancedSuggestions = enhanceSuggestionsWithEducation(validSuggestions as Suggestion[], text)

    // Generate educational report if requested
    let educationalReport = null
    if (generateReport) {
      educationalReport = generateEducationalReport(enhancedSuggestions, text)
    }

    // Identify mistake patterns for additional context
    const mistakePatterns = identifyMistakePatterns(text)

    const processingTime = Date.now() - startTime
    console.log(`Educational feedback enhancement completed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        enhancedSuggestions,
        educationalReport,
        mistakePatterns,
        statistics: {
          totalSuggestions: enhancedSuggestions.length,
          highLearningValue: enhancedSuggestions.filter(s => s.learningValue === 'high').length,
          mediumLearningValue: enhancedSuggestions.filter(s => s.learningValue === 'medium').length,
          lowLearningValue: enhancedSuggestions.filter(s => s.learningValue === 'low').length,
          withEducationalFeedback: enhancedSuggestions.filter(s => s.educationalFeedback).length,
          mistakePatterns: mistakePatterns.length
        }
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        textLength: text.length,
        suggestionsProcessed: suggestions.length,
        validSuggestions: validSuggestions.length
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Educational feedback enhancement error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to enhance suggestions with educational feedback',
        success: false,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

// GET /api/analysis/educational-feedback - Get grammar rules and educational content
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const ruleId = searchParams.get('ruleId')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    console.log(`Educational feedback GET request: action=${action}`)

    let responseData: any = {}

    switch (action) {
      case 'grammar-rule':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Missing ruleId parameter', success: false },
            { status: 400 }
          )
        }
        const rule = getGrammarRule(ruleId)
        if (!rule) {
          return NextResponse.json(
            { error: 'Grammar rule not found', success: false },
            { status: 404 }
          )
        }
        responseData = { rule }
        break

      case 'all-rules':
        responseData = { rules: getAllGrammarRules() }
        break

      case 'search-rules':
        if (!search) {
          return NextResponse.json(
            { error: 'Missing search parameter', success: false },
            { status: 400 }
          )
        }
        responseData = { rules: searchGrammarRules(search) }
        break

      case 'rules-by-category':
        if (!category) {
          return NextResponse.json(
            { error: 'Missing category parameter', success: false },
            { status: 400 }
          )
        }
        const { getGrammarRulesByCategory } = await import('@/lib/analysis/educational-feedback')
        responseData = { rules: getGrammarRulesByCategory(category as any) }
        break

      case 'rules-by-difficulty':
        if (!difficulty) {
          return NextResponse.json(
            { error: 'Missing difficulty parameter', success: false },
            { status: 400 }
          )
        }
        const { getGrammarRulesByDifficulty } = await import('@/lib/analysis/educational-feedback')
        responseData = { rules: getGrammarRulesByDifficulty(difficulty as any) }
        break

      case 'create-feedback':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Missing ruleId parameter', success: false },
            { status: 400 }
          )
        }
        const context = searchParams.get('context') || ''
        const mistakeType = searchParams.get('mistakeType') || undefined
        const feedback = createEducationalFeedback(ruleId, context, mistakeType)
        if (!feedback) {
          return NextResponse.json(
            { error: 'Could not create educational feedback', success: false },
            { status: 404 }
          )
        }
        responseData = { feedback }
        break

      case 'identify-patterns':
        const text = searchParams.get('text')
        if (!text) {
          return NextResponse.json(
            { error: 'Missing text parameter', success: false },
            { status: 400 }
          )
        }
        const patterns = identifyMistakePatterns(text)
        responseData = { patterns }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter', success: false },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    console.log(`Educational feedback GET completed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        action
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Educational feedback GET error:', error)

    return NextResponse.json(
      { 
        error: 'Failed to process educational feedback request',
        success: false,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
} 