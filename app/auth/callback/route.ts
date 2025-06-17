import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host") // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        // In development, redirect to localhost
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // In production, use the forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback to origin
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
