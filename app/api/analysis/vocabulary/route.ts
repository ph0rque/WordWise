import { NextRequest, NextResponse } from 'next/server'
import { enhanceVocabulary, analyzeVocabulary, suggestTransitionWords, getAcademicWordSuggestions } from '@/lib/analysis/vocabulary'

interface VocabularyRequest {
  text: string
  targetLevel?: 'high-school' | 'college'
  analysisType?: 'full' | 'analysis-only' | 'suggestions-only'
  transitionContext?: 'addition' | 'contrast' | 'cause' | 'sequence' | 'emphasis' | 'example'
  academicLevel?: 'elementary' | 'middle-school' | 'high-school' | 'college'
}

export async function POST(request: NextRequest) {
  try {
    console.log('Vocabulary analysis requested')
    
    // Parse request body
    let body: VocabularyRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error('Invalid JSON in request body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle special request types
    if (body.transitionContext) {
      console.log('Transition words requested for context:', body.transitionContext)
      const suggestions = suggestTransitionWords(body.transitionContext)
      return NextResponse.json({
        transitionWords: suggestions,
        context: body.transitionContext,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 200 })
    }

    if (body.academicLevel) {
      console.log('Academic word suggestions requested for level:', body.academicLevel)
      const suggestions = getAcademicWordSuggestions(body.academicLevel)
      return NextResponse.json({
        academicWords: suggestions,
        level: body.academicLevel,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 200 })
    }

    // Validate required fields for text analysis
    if (!body.text || typeof body.text !== 'string') {
      console.error('Missing or invalid text field')
      return NextResponse.json(
        { error: 'Text field is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate text length
    if (body.text.length > 10000) {
      console.error('Text too long:', body.text.length, 'characters')
      return NextResponse.json(
        { error: 'Text must be less than 10,000 characters' },
        { status: 400 }
      )
    }

    // Validate target level
    const targetLevel = body.targetLevel || 'high-school'
    if (!['high-school', 'college'].includes(targetLevel)) {
      console.error('Invalid target level:', targetLevel)
      return NextResponse.json(
        { error: 'Target level must be either "high-school" or "college"' },
        { status: 400 }
      )
    }

    // Validate analysis type
    const analysisType = body.analysisType || 'full'
    if (!['full', 'analysis-only', 'suggestions-only'].includes(analysisType)) {
      console.error('Invalid analysis type:', analysisType)
      return NextResponse.json(
        { error: 'Analysis type must be "full", "analysis-only", or "suggestions-only"' },
        { status: 400 }
      )
    }

    console.log(`Analyzing vocabulary for ${body.text.length} characters, target level: ${targetLevel}, type: ${analysisType}`)

    // Perform vocabulary analysis
    const startTime = Date.now()
    
    let result
    switch (analysisType) {
      case 'analysis-only':
        // Return basic analysis without enhancement feedback
        const analysis = analyzeVocabulary(body.text, targetLevel)
        result = { analysis }
        break
      
      case 'suggestions-only':
        // Return only vocabulary suggestions
        const suggestionAnalysis = analyzeVocabulary(body.text, targetLevel)
        result = { 
          suggestions: suggestionAnalysis.suggestions,
          totalWords: suggestionAnalysis.totalWords,
          informalWords: suggestionAnalysis.informalWords
        }
        break
      
      case 'full':
      default:
        // Return full enhancement with feedback
        const enhancement = enhanceVocabulary(body.text, targetLevel)
        result = enhancement
        break
    }

    const analysisTime = Date.now() - startTime
    console.log(`Vocabulary analysis completed in ${analysisTime}ms`)

    // Add metadata to response
    const response = {
      ...result,
      metadata: {
        analysisTime,
        textLength: body.text.length,
        targetLevel,
        analysisType,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in vocabulary analysis:', error)
    
    // Return generic error for security
    return NextResponse.json(
      { 
        error: 'Internal server error during vocabulary analysis',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for utility endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'transition-words') {
      const context = searchParams.get('context') as 'addition' | 'contrast' | 'cause' | 'sequence' | 'emphasis' | 'example'
      
      if (!context || !['addition', 'contrast', 'cause', 'sequence', 'emphasis', 'example'].includes(context)) {
        return NextResponse.json(
          { error: 'Valid context parameter required for transition words' },
          { status: 400 }
        )
      }
      
      const suggestions = suggestTransitionWords(context)
      return NextResponse.json({
        transitionWords: suggestions,
        context,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 200 })
    }
    
    if (action === 'academic-words') {
      const level = searchParams.get('level') as 'elementary' | 'middle-school' | 'high-school' | 'college'
      
      if (!level || !['elementary', 'middle-school', 'high-school', 'college'].includes(level)) {
        return NextResponse.json(
          { error: 'Valid level parameter required for academic words' },
          { status: 400 }
        )
      }
      
      const suggestions = getAcademicWordSuggestions(level)
      return NextResponse.json({
        academicWords: suggestions,
        level,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }, { status: 200 })
    }
    
    // Default GET response with available endpoints
    return NextResponse.json({
      message: 'Vocabulary Analysis API',
      endpoints: {
        POST: 'Analyze vocabulary in text',
        'GET?action=transition-words&context=<context>': 'Get transition words for specific context',
        'GET?action=academic-words&level=<level>': 'Get academic words for specific level'
      },
      contexts: ['addition', 'contrast', 'cause', 'sequence', 'emphasis', 'example'],
      levels: ['elementary', 'middle-school', 'high-school', 'college']
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in vocabulary GET request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze vocabulary or GET for utility endpoints.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze vocabulary or GET for utility endpoints.' },
    { status: 405 }
  )
} 