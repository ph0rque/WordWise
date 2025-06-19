import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const step = searchParams.get("step") // Check if this is part of role selection flow

  if (code) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      let redirectUrl = origin
      if (!isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}`
      }

      try {
        // Check if user has a role assigned in metadata
        const userRole = data.user.user_metadata?.role || data.user.app_metadata?.role

        console.log('Auth callback - User role:', userRole)

        // If user has an assigned role, redirect appropriately
        if (userRole) {
          console.log('Redirecting user with role:', userRole)
          if (userRole === 'admin') {
            return NextResponse.redirect(`${redirectUrl}/admin`)
          } else {
            return NextResponse.redirect(`${redirectUrl}/`)
          }
        }

        // If user has no role, redirect to role setup
        if (!userRole) {
          return NextResponse.redirect(`${redirectUrl}/auth/role-setup?user_id=${data.user.id}`)
        }

        // Default redirect
        return NextResponse.redirect(`${redirectUrl}${next}`)
      } catch (authError) {
        console.error("Auth error in callback:", authError)
        // Fallback to regular redirect if there's an auth issue
        return NextResponse.redirect(`${redirectUrl}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
