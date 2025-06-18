import { NextRequest, NextResponse } from "next/server"
import { checkAcademicGrammar } from "@/lib/ai/academic-grammar-checker"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, academicLevel = 'high-school', subject } = body

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      )
    }

    // Validate academic level
    if (academicLevel && !['high-school', 'college'].includes(academicLevel)) {
      return NextResponse.json(
        { error: 'Academic level must be either "high-school" or "college"' },
        { status: 400 }
      )
    }

    // Validate subject (optional)
    if (subject && typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Subject must be a string' },
        { status: 400 }
      )
    }

    console.log(`Academic grammar check requested for ${text.length} characters`)
    console.log(`Academic level: ${academicLevel}${subject ? `, Subject: ${subject}` : ''}`)

    // Check grammar with academic context
    const suggestions = await checkAcademicGrammar(text, academicLevel, subject)

    console.log(`Academic grammar check completed: ${suggestions.length} suggestions found`)

    // Add metadata about the check
    const response = {
      suggestions,
      metadata: {
        textLength: text.length,
        academicLevel,
        subject: subject || null,
        suggestionCount: suggestions.length,
        timestamp: new Date().toISOString(),
        aiUsed: process.env.OPENAI_API_KEY ? true : false,
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in academic grammar check API:', error)
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: 'Failed to check grammar. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 