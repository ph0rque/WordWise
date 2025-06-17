import { type NextRequest, NextResponse } from "next/server"
import { checkGrammarWithAI, isOpenAIAvailable } from "@/lib/openai-grammar-checker"
import { checkGrammar } from "@/lib/grammar-checker"

export async function POST(request: NextRequest) {
  try {
    const { text, settings } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "Text too long (max 10,000 characters)" }, { status: 400 })
    }

    let suggestions = []

    // Check if AI should be used based on settings and availability
    if (settings?.enableAI && isOpenAIAvailable()) {
      console.log("Using AI grammar checking")
      suggestions = await checkGrammarWithAI(text)
    } else {
      console.log("Using basic grammar checking")
      suggestions = checkGrammar(text)
    }

    // Filter suggestions based on settings
    if (settings) {
      suggestions = suggestions.filter((suggestion) => {
        switch (suggestion.type) {
          case "grammar":
            return settings.checkGrammar !== false
          case "spelling":
            return settings.checkSpelling !== false
          case "style":
            return settings.checkStyle !== false
          case "clarity":
            return settings.checkClarity !== false
          case "tone":
            return settings.checkTone !== false
          default:
            return true
        }
      })
    }

    return NextResponse.json({
      suggestions,
      aiUsed: settings?.enableAI && isOpenAIAvailable(),
    })
  } catch (error) {
    console.error("Grammar check API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
