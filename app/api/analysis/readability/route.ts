import { NextRequest, NextResponse } from 'next/server'
import { assessReadability, calculateReadabilityMetrics } from '@/lib/analysis/readability'

interface ReadabilityRequest {
  text: string
  targetLevel?: 'high-school' | 'college'
  includeMetrics?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('Readability analysis requested')
    
    // Parse request body
    let body: ReadabilityRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error('Invalid JSON in request body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
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

    console.log(`Analyzing readability for ${body.text.length} characters, target level: ${targetLevel}`)

    // Perform readability analysis
    const startTime = Date.now()
    
    let result
    if (body.includeMetrics) {
      // Return detailed metrics only
      const metrics = calculateReadabilityMetrics(body.text, targetLevel)
      result = { metrics }
    } else {
      // Return full assessment with feedback
      const assessment = assessReadability(body.text, targetLevel)
      result = assessment
    }

    const analysisTime = Date.now() - startTime
    console.log(`Readability analysis completed in ${analysisTime}ms`)

    // Add metadata to response
    const response = {
      ...result,
      metadata: {
        analysisTime,
        textLength: body.text.length,
        targetLevel,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in readability analysis:', error)
    
    // Return generic error for security
    return NextResponse.json(
      { 
        error: 'Internal server error during readability analysis',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze readability.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze readability.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze readability.' },
    { status: 405 }
  )
} 