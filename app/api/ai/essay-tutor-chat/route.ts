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
  console.log('🤖 AI Tutor Chat API called')

  try {
    // Parse request body with error handling
    let body
    try {
      body = await request.json()
      console.log('📥 Request body parsed:', { 
        hasMessage: !!body.message, 
        hasDocumentId: !!body.documentId,
        messageLength: body.message?.length || 0
      })
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body. Please check your data and try again.' },
        { status: 400 }
      )
    }

    const { 
      sessionId, 
      message, 
      documentContent, 
      documentTitle, 
      documentId,
      isStudent = true,
      messageHistory = [] 
    } = body

    // Validate required fields with detailed logging
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('❌ Invalid message:', { message })
      return NextResponse.json(
        { error: 'Please enter a message to continue the conversation.' },
        { status: 400 }
      )
    }

    if (!documentId) {
      console.log('❌ Missing documentId')
      return NextResponse.json(
        { error: 'Document ID is required. Please make sure you have a document open.' },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OpenAI API key')
      return NextResponse.json(
        { error: 'AI tutoring service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Database connection is not available. Please try again later.' },
        { status: 503 }
      )
    }

    // Get authenticated user with detailed error handling
    let supabase
    let user
    try {
      console.log('🔐 Creating Supabase client...')
      supabase = await createClient()
      console.log('✅ Supabase client created')
      
      console.log('👤 Getting user authentication...')
      const { data: userData, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Authentication error:', authError)
        return NextResponse.json(
          { error: 'Please sign in to use the AI tutor.' },
          { status: 401 }
        )
      }

      if (!userData.user) {
        console.log('❌ No user found in session')
        return NextResponse.json(
          { error: 'Please sign in to use the AI tutor.' },
          { status: 401 }
        )
      }

      user = userData.user
      console.log('✅ User authenticated:', user.id)

    } catch (authSetupError) {
      console.error('❌ Error setting up authentication:', authSetupError)
      return NextResponse.json(
        { error: 'Authentication setup failed. Please refresh the page and try again.' },
        { status: 500 }
      )
    }

    // Initialize session manager with error handling
    let sessionManager
    let chatSession
    try {
      console.log('💬 Initializing chat session manager...')
      sessionManager = new ChatSessionManager(supabase)
      
      console.log('📝 Getting or creating chat session...')
      chatSession = await sessionManager.getOrCreateSession(
        user.id,
        documentId,
        documentTitle ? `Chat: ${documentTitle}` : 'AI Tutor Chat'
      )
      console.log('✅ Chat session ready:', chatSession.id)

    } catch (sessionError) {
      console.error('❌ Error with chat session:', sessionError)
      return NextResponse.json(
        { error: 'Unable to create chat session. Please try again.' },
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
      console.log('🚫 Content writing request detected, sending educational response')
      
      // Save user message
      try {
        await sessionManager.addMessage(
          chatSession.id,
          'user',
          message,
          { status: 'delivered' }
        )
      } catch (saveError) {
        console.error('⚠️ Warning: Could not save user message:', saveError)
      }

      const educationalResponse = {
        content: "I can't write your essay or assignment for you, but I can help you become a better writer! Instead, let me guide you through the writing process. What specific aspect of writing would you like to work on? For example:\n\n• How to develop a strong thesis statement\n• Organizing your ideas into clear paragraphs\n• Finding and integrating evidence\n• Improving your academic writing style\n\nWhat would be most helpful for you right now?",
        confidence: 95,
        suggestedQuestions: [
          "How do I write a strong thesis statement?",
          "What makes a good topic sentence?",
          "How should I organize my essay?",
          "What's the best way to conclude my essay?"
        ],
        relatedConcepts: ["academic integrity", "writing process", "essay structure"],
        sessionId: chatSession.id,
        timestamp: new Date().toISOString()
      }

      // Save AI response
      try {
        await sessionManager.addMessage(
          chatSession.id,
          'assistant',
          educationalResponse.content,
          {
            confidence: educationalResponse.confidence,
            suggestedQuestions: educationalResponse.suggestedQuestions,
            relatedConcepts: educationalResponse.relatedConcepts,
            status: 'delivered'
          }
        )
      } catch (saveError) {
        console.error('⚠️ Warning: Could not save AI response:', saveError)
      }

      return NextResponse.json(educationalResponse)
    }

    // Save user message to database
    try {
      console.log('💾 Saving user message...')
      await sessionManager.addMessage(
        chatSession.id,
        'user',
        message,
        { status: 'delivered' }
      )
      console.log('✅ User message saved')
    } catch (error) {
      console.error('⚠️ Warning: Could not save user message:', error)
      // Continue processing even if message saving fails
    }

    // Get recent conversation history from database
    let conversationHistory: any[] = []
    try {
      console.log('📚 Fetching conversation history...')
      const recentMessages = await sessionManager.getSessionMessages(chatSession.id, 16)
      conversationHistory = recentMessages
        .slice(-8) // Use last 8 messages for context
        .map(msg => ({
          role: msg.messageType === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      console.log('✅ Conversation history loaded:', conversationHistory.length, 'messages')
    } catch (error) {
      console.error('⚠️ Warning: Could not fetch conversation history:', error)
      // Fall back to provided messageHistory if database fetch fails
      conversationHistory = messageHistory.slice(-8).map((msg: ChatMessage) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
      console.log('📋 Using fallback message history:', conversationHistory.length, 'messages')
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
      
      console.log('📄 Document context added:', { wordCount, charCount, previewLength: contentPreview.length })
    }

    // Prepare the prompt
    const fullPrompt = TUTOR_SYSTEM_PROMPT + contextPrompt

    // Call OpenAI API with comprehensive error handling
    let completion
    try {
      console.log('🤖 Calling OpenAI API...')
      completion = await openai.chat.completions.create({
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
      console.log('✅ OpenAI API response received')
      
    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError)
      
      // Return helpful fallback response
      const fallbackResponse = {
        content: "I'm having trouble connecting to the AI service right now. While I get that sorted out, here are some general writing tips:\n\n• Start with a clear thesis statement\n• Use topic sentences to introduce each paragraph\n• Support your points with specific evidence\n• Connect your ideas with transitions\n\nIs there a specific writing challenge you'd like help with?",
        confidence: 0,
        suggestedQuestions: [
          "How can I improve my essay structure?",
          "What makes good academic writing?",
          "How do I write better topic sentences?"
        ],
        relatedConcepts: ["writing help", "essay structure"],
        error: true,
        sessionId: chatSession.id,
        timestamp: new Date().toISOString()
      }

      // Try to save the fallback response
      try {
        await sessionManager.addMessage(
          chatSession.id,
          'assistant',
          fallbackResponse.content,
          {
            confidence: 0,
            suggestedQuestions: fallbackResponse.suggestedQuestions,
            relatedConcepts: fallbackResponse.relatedConcepts,
            status: 'error'
          }
        )
      } catch (saveError) {
        console.error('⚠️ Warning: Could not save fallback response:', saveError)
      }

      return NextResponse.json(fallbackResponse, { status: 200 }) // Return 200 to prevent "Failed to fetch"
    }

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

    const finalResponse = {
      content: response,
      confidence,
      suggestedQuestions,
      relatedConcepts,
      sessionId: chatSession.id,
      timestamp: new Date().toISOString()
    }

    // Save AI response to database
    try {
      console.log('💾 Saving AI response...')
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
      console.log('✅ AI response saved')
    } catch (error) {
      console.error('⚠️ Warning: Could not save AI response:', error)
      // Continue and return response even if saving fails
    }

    console.log('✅ AI Tutor response completed successfully')
    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('❌ Unexpected error in AI tutor chat:', error)
    
    // Return helpful error message that won't cause "Failed to fetch"
    const errorResponse = {
      content: "I'm having trouble responding right now. This might be a temporary issue. Please try:\n\n• Refreshing the page\n• Checking your internet connection\n• Trying again in a moment\n\nIf the problem continues, you can still work on your writing and try the AI tutor again later!",
      confidence: 0,
      suggestedQuestions: [
        "How can I improve my essay structure?",
        "What makes good academic writing?",
        "How do I write better topic sentences?"
      ],
      relatedConcepts: ["writing help", "technical issues"],
      error: true,
      timestamp: new Date().toISOString()
    }
    
    // Always return 200 status to prevent "Failed to fetch" errors
    return NextResponse.json(errorResponse, { status: 200 })
  }
} 