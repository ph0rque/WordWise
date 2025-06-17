import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  // Get the current site URL for redirects
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      redirectTo: `${siteUrl}/auth/callback`,
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  return supabaseInstance
}

export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
