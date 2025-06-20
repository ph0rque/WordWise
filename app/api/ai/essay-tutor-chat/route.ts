import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@/lib/supabase/server'
import { ChatSessionManager } from '@/lib/chat/session-manager'
import type { ChatMessage } from '@/components/tutor/chat-message'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Educational prompts and safeguards
const TUTOR_SYSTEM_PROMPT = `You are an AI writing tutor for high school students. Your role is to help students improve their writing skills through guidance, questions, and educational feedback - NOT to write content for them.

CORE PRINCIPLES:
- NEVER write essays, paragraphs, or sentences for students
- NEVER provide direct content that students could copy
- ALWAYS guide students to think critically and develop their own ideas
- Focus on teaching writing concepts, structure, and techniques
- Ask probing questions that help students discover solutions
- Provide examples of writing techniques, not example content for their specific topic

WHAT YOU CAN DO:
- Explain writing concepts (thesis statements, topic sentences, transitions, etc.)
- Suggest structural improvements and organizational strategies
- Help students brainstorm ideas through questions
- Provide feedback on clarity, flow, and academic style
- Teach grammar rules and writing conventions
- Guide students through the writing process
- Suggest research strategies and citation methods
- Help students understand assignment requirements

WHAT YOU CANNOT DO:
- Write any part of their essay or assignment
- Provide specific sentences or phrases for their topic
- Complete their homework or assignments
- Give them content to copy and paste
- Write examples using their specific topic or thesis

RESPONSE STYLE:
- Be encouraging and supportive
- Use Socratic questioning to guide discovery
- Provide clear, educational explanations
- Suggest 2-3 follow-up questions when appropriate
- Keep responses focused and concise (under 200 words typically)
- Use a friendly, mentor-like tone appropriate for high school students

SAFETY MEASURES:
- If asked to write content, redirect to teaching the underlying concept
- If asked for specific examples, provide generic examples or templates
- Always emphasize that the student's own ideas and voice are most important
- Encourage academic integrity and original thinking`

const CRITICAL_THINKING_PROMPTS = [
  "What evidence supports this point?",
  "How might someone disagree with this perspective?",
  "What are the implications of this argument?",
  "Can you think of a real-world example?",
  "What questions does this raise?",
  "How does this connect to your main thesis?"
]

const WRITING_CONCEPTS = [
  "thesis development",
  "paragraph structure", 
  "transitions",
  "evidence integration",
  "academic tone",
  "argument development",
  "conclusion strategies",
  "research methods"
]

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user using server-side authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      sessionId, 
      message, 
      documentContent, 
      documentTitle, 
      documentId,
      isStudent = true,
      messageHistory = [] 
    } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required for session management' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI tutoring service is not available' },
        { status: 503 }
      )
    }

    // Initialize session manager with server-side Supabase client
    const sessionManager = new ChatSessionManager(supabase)
    
    // Get or create chat session
    let chatSession
    try {
      chatSession = await sessionManager.getOrCreateSession(
        user.id,
        documentId,
        documentTitle ? `Chat: ${documentTitle}` : 'AI Tutor Chat'
      )
    } catch (error) {
      console.error('Error managing chat session:', error)
      return NextResponse.json(
        { error: 'Failed to manage chat session' },
        { status: 500 }
      )
    }

    // Content safety check - prevent attempts to get AI to write content
    const contentWritingKeywords = [
      'write my essay',
      'write my paragraph',
      'write my introduction',
      'write my conclusion',
      'write this for me',
      'complete my assignment',
      'finish my essay',
      'write about',
      'give me sentences',
      'provide examples about'
    ]

    const messageToCheck = message.toLowerCase()
    const isContentWritingRequest = contentWritingKeywords.some(keyword => 
      messageToCheck.includes(keyword)
    )

    if (isContentWritingRequest) {
      return NextResponse.json({
        content: "I can't write your essay or assignment for you, but I can help you become a better writer! Instead, let me guide you through the writing process. What specific aspect of writing would you like to work on? For example:\n\n• How to develop a strong thesis statement\n• Organizing your ideas into clear paragraphs\n• Finding and integrating evidence\n• Improving your academic writing style\n\nWhat would be most helpful for you right now?",
        confidence: 95,
        suggestedQuestions: [
          "How do I write a strong thesis statement?",
          "What makes a good topic sentence?",
          "How should I organize my essay?",
          "What's the best way to conclude my essay?"
        ],
        relatedConcepts: ["academic integrity", "writing process", "essay structure"]
      })
    }

    // Save user message to database
    try {
      await sessionManager.addMessage(
        chatSession.id,
        'user',
        message,
        { status: 'delivered' }
      )
    } catch (error) {
      console.error('Error saving user message:', error)
      // Continue processing even if message saving fails
    }

    // Get recent conversation history from database
    let conversationHistory: any[] = []
    try {
      const recentMessages = await sessionManager.getSessionMessages(chatSession.id, 16) // Get last 16 messages
      conversationHistory = recentMessages
        .slice(-8) // Use last 8 messages for context
        .map(msg => ({
          role: msg.messageType === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      // Fall back to provided messageHistory if database fetch fails
      conversationHistory = messageHistory.slice(-8).map((msg: ChatMessage) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    }

    // Add document context if available
    let contextPrompt = ''
    if (documentContent && documentContent.length > 0) {
      const wordCount = documentContent.split(/\s+/).length
      const charCount = documentContent.length
      
      // Include a portion of the document content for context (limit to ~500 chars to stay within token limits)
      const contentPreview = documentContent.length > 500 
        ? documentContent.substring(0, 500) + '...' 
        : documentContent
      
      contextPrompt = `\n\nSTUDENT'S CURRENT DOCUMENT: "${documentTitle}" (${wordCount} words, ${charCount} characters)\n\nCURRENT CONTENT:\n"${contentPreview}"\n\nYou can reference this specific content to provide targeted guidance about structure, clarity, writing techniques, or specific improvements. Help the student improve what they've written, but do not write content for them.`
    }

    // Prepare the prompt
    const fullPrompt = TUTOR_SYSTEM_PROMPT + contextPrompt

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: fullPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Please try asking your question again.'

    // Generate suggested follow-up questions based on the response
    const suggestedQuestions = CRITICAL_THINKING_PROMPTS
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)

    // Identify related writing concepts
    const relatedConcepts = WRITING_CONCEPTS
      .filter(concept => 
        response.toLowerCase().includes(concept.split(' ')[0]) ||
        message.toLowerCase().includes(concept.split(' ')[0])
      )
      .slice(0, 3)

    // Calculate confidence based on response quality
    const confidence = Math.min(95, Math.max(70, 
      85 + (response.length > 100 ? 5 : 0) + (relatedConcepts.length > 0 ? 5 : 0)
    ))

    // Save AI response to database
    try {
      await sessionManager.addMessage(
        chatSession.id,
        'assistant',
        response,
        {
          confidence,
          suggestedQuestions,
          relatedConcepts,
          status: 'delivered'
        }
      )
    } catch (error) {
      console.error('Error saving AI response:', error)
      // Continue and return response even if saving fails
    }

    return NextResponse.json({
      content: response,
      confidence,
      suggestedQuestions,
      relatedConcepts,
      sessionId: chatSession.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in essay tutor chat:', error)
    
    // Return helpful error message
    return NextResponse.json({
      content: "I'm having trouble responding right now. Please try again in a moment. If the problem persists, you might want to check your internet connection or try refreshing the page.",
      confidence: 0,
      suggestedQuestions: [
        "How can I improve my essay structure?",
        "What makes good academic writing?",
        "How do I write better topic sentences?"
      ],
      relatedConcepts: ["writing help", "technical issues"],
      error: true
    }, { status: 500 })
  }
} 