import { NextResponse } from "next/server"
import { isOpenAIAvailable } from "@/lib/openai-grammar-checker"

export async function GET() {
  try {
    const available = isOpenAIAvailable()
    return NextResponse.json({ available })
  } catch (error) {
    console.error("AI status check error:", error)
    return NextResponse.json({ available: false })
  }
}
