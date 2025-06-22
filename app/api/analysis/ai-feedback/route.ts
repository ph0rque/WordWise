import { NextRequest, NextResponse } from 'next/server'
import { isOpenAIAvailable } from '@/lib/openai-grammar-checker'

interface AIFeedbackRequest {
  text: string
  targetLevel?: 'high-school' | 'college'
  analysisType?: 'comprehensive' | 'readability' | 'vocabulary' | 'academic-style'
}

export async function POST(request: NextRequest) {
  try {
    const body: AIFeedbackRequest = await request.json()
    const { text, targetLevel = 'high-school', analysisType = 'comprehensive' } = body

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

    if (!isOpenAIAvailable()) {
      console.log('OpenAI not available, falling back to basic analysis')
      return getFallbackAnalysis(text, targetLevel)
    }

    // Use OpenAI for intelligent analysis
    const analysis = await generateAIFeedback(text, targetLevel, analysisType)
    
    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        textLength: text.length,
        targetLevel,
        analysisType,
        timestamp: new Date().toISOString(),
        aiGenerated: true
      }
    })

  } catch (error) {
    console.error('Error in AI feedback analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateAIFeedback(
  text: string, 
  targetLevel: 'high-school' | 'college',
  analysisType: string
) {
  const { createOpenAI } = await import("@ai-sdk/openai")
  const { generateObject } = await import("ai")
  const { z } = await import("zod")

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const FeedbackSchema = z.object({
    overallScore: z.number().min(0).max(100),
    gradeLevel: z.number().min(1).max(20),
    readingLevel: z.enum(['elementary', 'middle-school', 'high-school', 'college', 'graduate']),
    difficulty: z.enum(['Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult']),
    
    strengths: z.array(z.string()).max(5),
    areasForImprovement: z.array(z.string()).min(3).max(5),
    specificRecommendations: z.array(z.string()).min(3).max(5),
    
    readabilityMetrics: z.object({
      wordCount: z.number(),
      sentenceCount: z.number(),
      averageWordsPerSentence: z.number(),
      vocabularyComplexity: z.enum(['elementary', 'middle-school', 'high-school', 'college', 'graduate']),
      academicVocabularyPercentage: z.number().min(0).max(100)
    }),
    
    priorityFocus: z.array(z.string()).max(3)
  })

  const levelDescription = targetLevel === 'high-school' 
    ? 'high school (9th-12th grade) academic writing'
    : 'college-level academic writing'

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: FeedbackSchema,
    prompt: `
      You are an expert writing instructor analyzing ${levelDescription}. Provide targeted, actionable feedback.

      CRITICAL ANALYSIS REQUIREMENTS:
      
      1. CONSISTENCY CHECK: Ensure all metrics align logically
         - If grade level is "Adult/Graduate", vocabulary must be sophisticated
         - If reading level is "high-school", don't say vocabulary is "elementary"
         - Areas for improvement must match the actual analysis
      
      2. TARGETED FEEDBACK (3-5 specific points):
         - Focus on the most impactful improvements
         - Be specific, not generic (avoid "improve vocabulary" - say what specifically)
         - Prioritize issues that will help the student most
      
      3. ACCURATE ASSESSMENT:
         - Calculate actual grade level based on sentence complexity and vocabulary
         - Match difficulty rating to actual text complexity
         - Vocabulary assessment must reflect actual word choices
      
      4. ACTIONABLE RECOMMENDATIONS:
         - Provide specific steps the student can take
         - Focus on 2-3 priority areas rather than many surface issues
         - Include concrete examples when possible
      
      Text to analyze:
      "${text}"
      
      Analyze this text thoroughly and provide consistent, helpful feedback that will genuinely help a ${targetLevel} student improve their academic writing.
      
      Remember: Areas for improvement should be specific and actionable, not contradictory placeholder text.
    `,
  })

  return {
    overallScore: object.overallScore,
    gradeLevel: object.gradeLevel,
    readingLevel: object.readingLevel,
    difficulty: object.difficulty,
    
    strengths: object.strengths,
    areasForImprovement: object.areasForImprovement,
    recommendations: object.specificRecommendations,
    
    metrics: {
      wordCount: object.readabilityMetrics.wordCount,
      sentenceCount: object.readabilityMetrics.sentenceCount,
      averageWordsPerSentence: object.readabilityMetrics.averageWordsPerSentence,
      vocabularyLevel: object.readabilityMetrics.vocabularyComplexity,
      academicVocabularyPercentage: object.readabilityMetrics.academicVocabularyPercentage,
      readingTimeMinutes: Math.ceil(object.readabilityMetrics.wordCount / 200) // Assume 200 WPM
    },
    
    priorityFocus: object.priorityFocus
  }
}

function getFallbackAnalysis(text: string, targetLevel: 'high-school' | 'college') {
  // Import local analysis functions
  const { calculateReadabilityMetrics } = require('@/lib/analysis/readability')
  const { analyzeVocabulary } = require('@/lib/analysis/vocabulary')
  
  const readabilityMetrics = calculateReadabilityMetrics(text, targetLevel)
  const vocabularyAnalysis = analyzeVocabulary(text, targetLevel)
  
  // Generate basic feedback based on metrics
  const strengths: string[] = []
  const areasForImprovement: string[] = []
  const recommendations: string[] = []
  
  // Basic analysis logic
  if (readabilityMetrics.appropriateForLevel) {
    strengths.push(`Writing complexity appropriate for ${targetLevel}`)
  } else if (readabilityMetrics.recommendedGradeLevel < (targetLevel === 'high-school' ? 9 : 13)) {
    areasForImprovement.push('Increase sentence complexity and vocabulary sophistication')
    recommendations.push('Use more varied sentence structures and academic vocabulary')
  } else {
    areasForImprovement.push('Simplify overly complex sentences for better clarity')
    recommendations.push('Break down long sentences into clearer, more digestible parts')
  }
  
  if (vocabularyAnalysis.academicWords / vocabularyAnalysis.totalWords < 0.1) {
    areasForImprovement.push('Limited use of academic vocabulary')
    recommendations.push('Incorporate more formal, discipline-specific terminology')
  }
  
  if (readabilityMetrics.averageWordsPerSentence < 10) {
    areasForImprovement.push('Sentences could be more developed')
    recommendations.push('Add more detail and complexity to sentence structures')
  } else if (readabilityMetrics.averageWordsPerSentence > 25) {
    areasForImprovement.push('Some sentences are overly long')
    recommendations.push('Break up complex sentences for better readability')
  }
  
  // Ensure we have at least 3 items in each category
  if (areasForImprovement.length < 3) {
    areasForImprovement.push('Continue developing academic writing skills')
  }
  if (recommendations.length < 3) {
    recommendations.push('Practice writing with feedback to improve consistently')
  }
  
  return NextResponse.json({
    success: true,
    analysis: {
      overallScore: Math.max(40, Math.min(85, 70 - (areasForImprovement.length * 5))),
      gradeLevel: readabilityMetrics.recommendedGradeLevel,
      readingLevel: readabilityMetrics.readingLevel,
      difficulty: readabilityMetrics.fleschReadingEase > 70 ? 'Easy' : 
                  readabilityMetrics.fleschReadingEase > 50 ? 'Moderate' : 'Difficult',
      
      strengths: strengths.length > 0 ? strengths : ['Shows effort in academic writing'],
      areasForImprovement,
      recommendations,
      
      metrics: {
        wordCount: readabilityMetrics.wordCount,
        sentenceCount: readabilityMetrics.sentenceCount,
        averageWordsPerSentence: readabilityMetrics.averageWordsPerSentence,
        vocabularyLevel: vocabularyAnalysis.academicLevel,
        academicVocabularyPercentage: (vocabularyAnalysis.academicWords / vocabularyAnalysis.totalWords) * 100,
        readingTimeMinutes: Math.ceil(readabilityMetrics.wordCount / 200)
      },
      
      priorityFocus: areasForImprovement.slice(0, 3)
    },
    metadata: {
      textLength: text.length,
      targetLevel,
      timestamp: new Date().toISOString(),
      aiGenerated: false
    }
  })
} 